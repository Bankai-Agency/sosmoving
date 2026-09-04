import { classifyPage } from "./pages";
import { guessPageName, type PageType } from "./page-types";

/**
 * Page duplication - the pure planning half. Given the source page and the
 * current repo files it returns the exact file set a duplicate needs, so
 * the server action only has to read, plan and commit.
 *
 * What a complete duplicate consists of (learned the hard way on
 * /services/shared-load-moving):
 *   - public/pages/<new>.html          the page itself (routes are file-driven)
 *   - src/data/seo-meta.json           title/description/canonical/og entry
 *   - public/wf-page-map.json          Webflow page id  -> IX2 animations
 *   - public/wf-bundle-map.json        Webflow bundle   -> page scripts
 *   - src/data/cities|services/_registry.json   sitemap (indexable pages)
 *   - src/data/jsonld/<new>.json       structured data, when the source has it
 */

const SITE = "https://www.sosmovingla.net";

export type DuplicateInput = {
  sourceSlug: string;
  newSlug: string;
  /** Text to swap everywhere outside urls/paths, e.g. "Eastvale" -> "Pomona". */
  replaceFrom: string;
  replaceTo: string;
  /** Optional overrides; empty = inherit from the source with the swap applied. */
  title: string;
  description: string;
  /** false = noindex,follow and no sitemap/registry entry (ad landings). */
  indexable: boolean;
};

export type RepoSnapshot = {
  sourceHtml: string;
  seoMetaJson: string;
  pageMapJson: string;
  bundleMapJson: string;
  citiesRegistryJson: string;
  servicesRegistryJson: string;
  sourceJsonld: string | null;
};

export type RepoFileChange = { path: string; content: string };

export type DuplicatePlan = {
  files: RepoFileChange[];
  newUrl: string;
  type: PageType;
  notes: string[];
};

type SeoEntry = {
  url: string;
  title: string;
  description: string;
  canonical: string;
  robots: string;
  h1: string;
  lang: string;
  og: Record<string, string>;
  twitter: Record<string, string>;
  jsonldFile: string | null;
  jsonldExpected: number;
};

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Exact, UPPER and lower variants of the swap - "Studio City" also fixes "studio city". */
export function replacementPairs(from: string, to: string): [string, string][] {
  const f = from.trim();
  const t = to.trim();
  if (!f || !t || f === t) return [];
  const pairs: [string, string][] = [[f, t]];
  if (f.toUpperCase() !== f) pairs.push([f.toUpperCase(), t.toUpperCase()]);
  if (f.toLowerCase() !== f) pairs.push([f.toLowerCase(), t.toLowerCase()]);
  return pairs;
}

export function replaceText(text: string, pairs: [string, string][]): string {
  let out = text;
  // Function replacer: "$&" / "$1" typed into the dialog must stay literal.
  for (const [f, t] of pairs) out = out.replace(new RegExp(escapeRe(f), "g"), () => t);
  return out;
}

/**
 * Attributes whose values are identifiers or file paths: a city name inside
 * an image filename or a class must survive the text swap untouched.
 */
const PROTECTED_ATTR =
  /((?:src|srcset|href|data-src|poster|action|style|class|id|for|name|value|data-w-id|data-wf-page-id|data-wf-element-id)\s*=\s*(?:"[^"]*"|'[^']*'))/g;

export function replaceOutsideAttrs(html: string, pairs: [string, string][]): string {
  if (pairs.length === 0) return html;
  // One capture group -> odd indices are the protected attribute tokens.
  const parts = html.split(PROTECTED_ATTR);
  return parts.map((p, i) => (i % 2 === 1 ? p : replaceText(p, pairs))).join("");
}

/**
 * Plain-text/JSON contexts (seo fields, JSON-LD): urls are protected the
 * same way attributes are in html - a city name inside a page url or an
 * image filename must not turn into the new name.
 */
const URL_TOKEN = /(https?:\/\/[^"'\s<>]+|"\/[^"\s]*")/g;

export function replaceOutsideUrls(text: string, pairs: [string, string][]): string {
  if (pairs.length === 0) return text;
  const parts = text.split(URL_TOKEN);
  return parts.map((p, i) => (i % 2 === 1 ? p : replaceText(p, pairs))).join("");
}

/** Self-references (absolute and relative) point at the copy, not the source. */
export function replacePageUrl(text: string, oldUrl: string, newUrl: string): string {
  if (oldUrl === newUrl) return text;
  const abs = new RegExp(`${escapeRe(SITE + oldUrl)}(?=["'?#\\s]|$)`, "g");
  const rel = new RegExp(`(["'=(])${escapeRe(oldUrl)}(?=["'?#\\s)]|$)`, "g");
  return text.replace(abs, SITE + newUrl).replace(rel, `$1${newUrl}`);
}

/** Append one entry keeping the file's 2-space layout instead of re-serializing 570+ entries. */
export function insertSeoEntry(seoMetaJson: string, entry: SeoEntry): string {
  const end = seoMetaJson.lastIndexOf("]");
  const head = end >= 0 ? seoMetaJson.slice(0, end).trimEnd() : "";
  if (!head.endsWith("}")) throw new Error("seo-meta.json: неожиданный формат, не могу добавить запись");
  const body = JSON.stringify(entry, null, 2)
    .split("\n")
    .map((l) => `  ${l}`)
    .join("\n");
  return `${head},\n${body}\n]\n`;
}

const IMAGE_KEYS = new Set(["og:image", "twitter:image"]);

export function planDuplicate(input: DuplicateInput, snap: RepoSnapshot): DuplicatePlan {
  const { sourceSlug, newSlug } = input;
  const src = classifyPage(sourceSlug);
  const dst = classifyPage(newSlug);
  const files: RepoFileChange[] = [];
  const notes: string[] = [];
  const pairs = replacementPairs(input.replaceFrom, input.replaceTo);
  const swap = (s: string) => replacePageUrl(replaceOutsideUrls(s, pairs), src.url, dst.url);

  // 1. The page html: text swap outside identifiers/paths, then self-links.
  const html = replacePageUrl(replaceOutsideAttrs(snap.sourceHtml, pairs), src.url, dst.url);
  files.push({ path: `public/pages/${newSlug}.html`, content: html });
  if (pairs.length > 0) {
    notes.push(`Текст «${pairs[0][0]}» → «${pairs[0][1]}» заменён в разметке (вне ссылок и путей к файлам)`);
  }

  // 2. SEO entry.
  const seo = JSON.parse(snap.seoMetaJson) as SeoEntry[];
  if (seo.some((e) => e.url === dst.url)) {
    throw new Error(`В seo-meta.json уже есть запись для ${dst.url}`);
  }
  const srcEntry = seo.find((e) => e.url === src.url) ?? null;
  const entry: SeoEntry = srcEntry
    ? (JSON.parse(JSON.stringify(srcEntry)) as SeoEntry)
    : {
        url: dst.url,
        title: guessPageName(newSlug),
        description: "",
        canonical: "",
        robots: "",
        h1: guessPageName(newSlug),
        lang: "en",
        og: {},
        twitter: {},
        jsonldFile: null,
        jsonldExpected: 0,
      };
  if (!srcEntry) notes.push("У исходной страницы не было SEO-записи - заполните title и description в seo-meta.json");
  entry.url = dst.url;
  entry.canonical = `${SITE}${dst.url}`;
  entry.title = swap(entry.title);
  entry.description = swap(entry.description);
  entry.h1 = swap(entry.h1);
  for (const bag of [entry.og, entry.twitter]) {
    for (const k of Object.keys(bag)) {
      bag[k] = IMAGE_KEYS.has(k) ? replacePageUrl(bag[k], src.url, dst.url) : swap(bag[k]);
    }
  }
  const title = input.title.trim();
  if (title) {
    entry.title = title;
    if ("og:title" in entry.og) entry.og["og:title"] = title;
    if ("twitter:title" in entry.twitter) entry.twitter["twitter:title"] = title;
  }
  const description = input.description.trim();
  if (description) {
    entry.description = description;
    if ("og:description" in entry.og) entry.og["og:description"] = description;
    if ("twitter:description" in entry.twitter) entry.twitter["twitter:description"] = description;
  }
  entry.robots = input.indexable ? "" : "noindex, follow";

  // 3. Structured data, when the source carries some.
  if (snap.sourceJsonld) {
    const name = newSlug.replace(/__/g, "_");
    const content = swap(snap.sourceJsonld);
    try {
      JSON.parse(content);
    } catch {
      throw new Error("Замена текста сломала JSON-LD (кавычки в новом названии?) - уберите спецсимволы");
    }
    files.push({ path: `src/data/jsonld/${name}.json`, content });
    entry.jsonldFile = `data/jsonld/${name}.json`;
    entry.jsonldExpected = 1;
    notes.push("Скопирована JSON-LD разметка");
  } else {
    entry.jsonldFile = null;
    entry.jsonldExpected = 0;
  }
  files.push({ path: "src/data/seo-meta.json", content: insertSeoEntry(snap.seoMetaJson, entry) });

  // 4. Webflow maps - without them data-wf-page is never set and IX2 stays dead.
  const maps: [string, string][] = [
    ["public/wf-page-map.json", snap.pageMapJson],
    ["public/wf-bundle-map.json", snap.bundleMapJson],
  ];
  for (const [path, json] of maps) {
    const map = JSON.parse(json) as Record<string, string>;
    if (map[src.url]) {
      map[dst.url] = map[src.url];
      files.push({ path, content: JSON.stringify(map) });
    } else {
      notes.push(`Внимание: ${path} не знает исходную страницу, анимации Webflow на копии не запустятся`);
    }
  }

  // 5. Registries feed the sitemap (and the services listing).
  if (!input.indexable) {
    notes.push("noindex, follow - в sitemap и реестры не добавлена (рекламный лендинг)");
  } else if (dst.type === "city" || dst.type === "movers-city") {
    const reg = JSON.parse(snap.citiesRegistryJson) as { slug: string; parentSlug: string | null }[];
    const [parent, child] = newSlug.includes("__") ? newSlug.split("__") : [null, newSlug];
    if (!reg.some((r) => r.slug === child && (r.parentSlug ?? null) === parent)) {
      reg.push({ slug: child, parentSlug: parent });
      files.push({ path: "src/data/cities/_registry.json", content: `${JSON.stringify(reg, null, 2)}\n` });
      notes.push("Добавлена в реестр городов (попадёт в sitemap)");
    }
  } else if (dst.type === "service") {
    const reg = JSON.parse(snap.servicesRegistryJson) as { slug: string; title: string }[];
    const slug = newSlug.replace(/^services__/, "");
    if (!reg.some((r) => r.slug === slug)) {
      reg.push({ slug, title: title || (srcEntry ? swap(srcEntry.h1) : "") || guessPageName(newSlug) });
      files.push({ path: "src/data/services/_registry.json", content: `${JSON.stringify(reg, null, 2)}\n` });
      notes.push("Добавлена в реестр услуг (sitemap и список услуг)");
    }
  }

  return { files, newUrl: dst.url, type: dst.type, notes };
}
