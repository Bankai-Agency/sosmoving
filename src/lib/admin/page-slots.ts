/**
 * Page slots — extract the per-city editable content ("slots") out of a
 * legacy Webflow HTML blob and write edits back with **exact-substring
 * replacement**. The document is never re-serialized as a whole, so a save
 * touches only the slots that changed — same minimal-diff guarantee as a
 * hand edit (matters for the 1:1 Webflow parity of everything else).
 *
 * Slots v1 (the content that actually varies between city pages):
 *   - hero H1        (lines; <br> is the line separator, wrapper tag kept)
 *   - hero subtitle  (plain text; $NNN/hr tokens re-wrapped in the yellow
 *                     `.text-span` highlight, rest in <strong> — the exact
 *                     markup pattern the pages already use)
 *   - FAQ            (question/answer pairs; only "simple" items are
 *                     editable — plain-text <p> paragraphs, no nested divs)
 *   - images         (src/alt of every unique <img>; srcset/sizes dropped
 *                     when src is replaced so the new image actually shows)
 *
 * This module is pure string-in/string-out — no fs, no network — so it is
 * unit-testable against the real page files.
 */

export type HeroH1Slot = { lines: string[]; original: string };
export type HeroSubtitleSlot = { text: string; original: string; bold: boolean };
export type FaqSlot = {
  q: string;
  a: string; // plain text, paragraphs separated by a blank line
  qOriginal: string; // full <h3 ...>...</h3>
  aOriginal: string; // full <div class="faq-dd-content...">...</div>
};
export type ImageSlot = { src: string; alt: string; original: string };

export type PageSlots = {
  heroH1: HeroH1Slot | null;
  heroSubtitle: HeroSubtitleSlot | null;
  faq: FaqSlot[];
  images: ImageSlot[];
};

export type PageEdits = {
  heroH1?: string[]; // lines
  heroSubtitle?: string;
  faq?: { q: string; a: string }[]; // positional, same length as extracted
  images?: { src: string; alt: string }[]; // positional, same length as extracted
};

// ============================================================
// Entities: the tiny subset the slots actually contain
// ============================================================

export function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, "\u00A0")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&rsquo;/g, "’")
    .replace(/&middot;/g, "·")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

export function encodeText(s: string): string {
  // Escape the HTML-significant chars (incl. `"` - the same encoder is used
  // inside double-quoted attributes); re-encode NBSP so the file stays
  // ASCII-friendly like the rest of the Webflow export.
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\u00A0/g, "&nbsp;");
}

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, "");
}

// ============================================================
// Extraction
// ============================================================

const H1_RE = /<h1 class="services-hero-h1[^"]*"[^>]*>([\s\S]*?)<\/h1>/;

function extractHeroH1(html: string): HeroH1Slot | null {
  // Skip Webflow-editor junk: empty duplicate h1s before the real one.
  const re = new RegExp(H1_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (stripTags(m[1]).trim() !== "") {
      const lines = m[1]
        .split(/<br\s*\/?>/)
        .map((part) => decodeEntities(stripTags(part)).trim())
        .filter((l) => l !== "");
      if (lines.length === 0) return null;
      return { lines, original: m[0] };
    }
  }
  return null;
}

function extractHeroSubtitle(html: string, afterH1: HeroH1Slot | null): HeroSubtitleSlot | null {
  const from = afterH1 ? html.indexOf(afterH1.original) + afterH1.original.length : 0;
  const m = /<div class="section-subtitle[^"]*">([\s\S]*?)<\/div>/.exec(html.slice(from));
  if (!m) return null;
  if (m[1].includes("<div")) return null; // unexpected nesting — don't touch
  const text = decodeEntities(stripTags(m[1])).trim();
  if (!text) return null;
  // Some pages wrap the subtitle in <strong>, some don't — keep whichever
  // weight the page had.
  return { text, original: m[0], bold: /<strong>/.test(m[1]) };
}

function extractFaq(html: string): FaqSlot[] {
  const qs = [...html.matchAll(/<h3 class="dropdown-title">([\s\S]*?)<\/h3>/g)];
  const as = [...html.matchAll(/<div class="faq-dd-content[^"]*">([\s\S]*?)<\/div>/g)];
  if (qs.length === 0 || qs.length !== as.length) return [];

  const items: FaqSlot[] = [];
  for (let i = 0; i < qs.length; i++) {
    const qInner = qs[i][1];
    const aInner = as[i][1];
    // Editable only when the item is "simple": plain-text question and an
    // answer that is nothing but plain-text <p> paragraphs. Anything richer
    // (links, lists, images) is skipped rather than flattened.
    if (qInner.includes("<")) continue;
    const paragraphs = [...aInner.matchAll(/<p>([\s\S]*?)<\/p>/g)];
    const rebuilt = paragraphs.map((p) => `<p>${p[1]}</p>`).join("");
    if (rebuilt !== aInner.trim() || paragraphs.some((p) => p[1].includes("<"))) continue;
    items.push({
      q: decodeEntities(qInner).trim(),
      a: paragraphs.map((p) => decodeEntities(p[1]).trim()).join("\n\n"),
      qOriginal: qs[i][0],
      aOriginal: as[i][0],
    });
  }
  return items;
}

function extractImages(html: string): ImageSlot[] {
  const seen = new Set<string>();
  const out: ImageSlot[] = [];
  for (const m of html.matchAll(/<img\s[^>]*>/g)) {
    const tag = m[0];
    if (seen.has(tag)) continue;
    seen.add(tag);
    const src = /\ssrc="([^"]*)"/.exec(tag)?.[1] ?? "";
    if (!src || src.startsWith("data:")) continue;
    const alt = decodeEntities(/\salt="([^"]*)"/.exec(tag)?.[1] ?? "").trim();
    out.push({ src, alt, original: tag });
  }
  return out;
}

export function extractSlots(html: string): PageSlots {
  const heroH1 = extractHeroH1(html);
  return {
    heroH1,
    heroSubtitle: extractHeroSubtitle(html, heroH1),
    faq: extractFaq(html),
    images: extractImages(html),
  };
}

// ============================================================
// Rebuild + apply
// ============================================================

function rebuildH1(slot: HeroH1Slot, lines: string[]): string {
  const openTag = /^<h1[^>]*>/.exec(slot.original)![0];
  const inner = slot.original.slice(openTag.length, -"</h1>".length);
  const newInner = lines.map((l) => encodeText(l.trim())).filter(Boolean).join("<br>");
  // Keep a single full-width wrapper (<strong>/<span ...>) when present so
  // the page's typography classes survive the edit.
  const w = /^\s*<(strong|span)([^>]*)>([\s\S]*)<\/\1>\s*$/.exec(inner);
  if (w) return `${openTag}<${w[1]}${w[2]}>${newInner}</${w[1]}>${"</h1>"}`;
  return `${openTag}${newInner}</h1>`;
}

const PRICE_RE = /\$\d+(?:\.\d{1,2})?\/hr/g;

function rebuildSubtitle(slot: HeroSubtitleSlot, text: string): string {
  const openTag = /^<div[^>]*>/.exec(slot.original)![0];
  const trimmed = text.trim();
  const seg = (s: string) => (slot.bold ? `<strong>${encodeText(s)}</strong>` : encodeText(s));
  const price = (s: string) =>
    slot.bold
      ? `<span class="text-span"><strong>${encodeText(s)}</strong></span>`
      : `<span class="text-span">${encodeText(s)}</span>`;
  let inner = "";
  let last = 0;
  for (const m of trimmed.matchAll(PRICE_RE)) {
    const before = trimmed.slice(last, m.index);
    if (before) inner += seg(before);
    inner += price(m[0]);
    last = m.index! + m[0].length;
  }
  const tail = trimmed.slice(last);
  if (tail) inner += seg(tail);
  return `${openTag}${inner}</div>`;
}

function rebuildFaqAnswer(slot: FaqSlot, a: string): string {
  const openTag = /^<div[^>]*>/.exec(slot.aOriginal)![0];
  const paragraphs = a
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${encodeText(p)}</p>`)
    .join("");
  return `${openTag}${paragraphs}</div>`;
}

function rebuildImage(slot: ImageSlot, src: string, alt: string): string {
  // Function replacers throughout — `$`-patterns in user values must stay
  // literal, and everything landing inside a quoted attribute is encoded.
  let tag = slot.original;
  if (/\salt="/.test(tag)) {
    tag = tag.replace(/(\salt=")[^"]*(")/, (_m, p1, p2) => p1 + encodeText(alt) + p2);
  } else {
    tag = tag.replace(/^<img\s/, () => `<img alt="${encodeText(alt)}" `);
  }
  if (src !== slot.src) {
    tag = tag.replace(/(\ssrc=")[^"]*(")/, (_m, p1, p2) => p1 + encodeText(src) + p2);
    // A stale srcset would silently override the new src — drop it.
    tag = tag.replace(/\s(?:srcset|sizes)="[^"]*"/g, "");
  }
  return tag;
}

/** Replace `original` with `next`, insisting the original is still there. */
function replaceExact(html: string, original: string, next: string, what: string): string {
  if (original === next) return html;
  const first = html.indexOf(original);
  if (first === -1) {
    throw new Error(`Слот «${what}» не найден в файле – страница изменилась, обновите редактор.`);
  }
  return html.split(original).join(next);
}

/**
 * Apply edits to the raw HTML. Returns the new HTML and a human list of
 * what changed (empty list — nothing to commit).
 */
export function applySlots(html: string, edits: PageEdits): { html: string; changed: string[] } {
  const slots = extractSlots(html);
  const changed: string[] = [];
  let out = html;

  if (edits.heroH1 && slots.heroH1) {
    const lines = edits.heroH1.map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) throw new Error("Заголовок не может быть пустым.");
    if (lines.join("\n") !== slots.heroH1.lines.join("\n")) {
      out = replaceExact(out, slots.heroH1.original, rebuildH1(slots.heroH1, lines), "H1");
      changed.push("hero H1");
    }
  }

  if (edits.heroSubtitle !== undefined && slots.heroSubtitle) {
    const text = edits.heroSubtitle.trim();
    if (text && text !== slots.heroSubtitle.text) {
      out = replaceExact(out, slots.heroSubtitle.original, rebuildSubtitle(slots.heroSubtitle, text), "подзаголовок");
      changed.push("hero subtitle");
    }
  }

  if (edits.faq) {
    if (edits.faq.length !== slots.faq.length) {
      throw new Error("FAQ изменился с момента загрузки – обновите редактор.");
    }
    edits.faq.forEach((item, i) => {
      const slot = slots.faq[i];
      const q = item.q.trim();
      const a = item.a.trim();
      if (!q || !a) throw new Error(`FAQ №${i + 1}: вопрос и ответ не могут быть пустыми.`);
      if (q !== slot.q) {
        out = replaceExact(out, slot.qOriginal, `<h3 class="dropdown-title">${encodeText(q)}</h3>`, `FAQ вопрос №${i + 1}`);
        changed.push(`FAQ q${i + 1}`);
      }
      if (a !== slot.a) {
        out = replaceExact(out, slot.aOriginal, rebuildFaqAnswer(slot, a), `FAQ ответ №${i + 1}`);
        changed.push(`FAQ a${i + 1}`);
      }
    });
  }

  if (edits.images) {
    if (edits.images.length !== slots.images.length) {
      throw new Error("Список картинок изменился с момента загрузки – обновите редактор.");
    }
    edits.images.forEach((img, i) => {
      const slot = slots.images[i];
      const src = img.src.trim() || slot.src;
      if (src !== slot.src && !/^(\/|https?:\/\/)[^\s"'<>]*$/.test(src)) {
        throw new Error(`Картинка №${i + 1}: недопустимый путь «${src}».`);
      }
      const alt = img.alt.trim();
      if (src !== slot.src || alt !== slot.alt) {
        out = replaceExact(out, slot.original, rebuildImage(slot, src, alt), `картинка №${i + 1}`);
        changed.push(`image ${i + 1}`);
      }
    });
  }

  return { html: out, changed };
}
