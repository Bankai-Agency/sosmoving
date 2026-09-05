import { decodeEntities, encodeText } from "./page-slots";

/**
 * The 429 scraped articles render from `public/pages/blog__<slug>.html`
 * while their markdown is untouched (see savePost). Their heading lives in
 * that snapshot, so an admin edit of the title has to reach the snapshot
 * itself; the frontmatter title alone only feeds JSON-LD and the category
 * listings. These helpers do the targeted text swaps - the document is not
 * re-serialized, only the matched fragments change (same rule as page-slots).
 *
 * Listing cards and "related articles" blocks in OTHER snapshots keep the
 * old heading until the blog migrates off the snapshots - by design.
 */

const H1_RE = /(<h1 class="services-hero-h1 is-blog-article-h1[^"]*"[^>]*>)([^<]*)(<\/h1>)/;
const CRUMB_RE = /(<a [^>]*class="breadcrumbs-link w--current"[^>]*>)([^<]*)(<\/a>)/;

/** The article heading as shown on the site (entities decoded). Null when the snapshot has no blog H1. */
export function snapshotTitle(html: string): string | null {
  const m = H1_RE.exec(html);
  return m ? decodeEntities(m[2]).trim() : null;
}

/**
 * Put `title` into the article H1, the current breadcrumb (when it mirrors
 * the heading) and the cover image alt (same). `changed` is false when the
 * snapshot has no blog H1 or already carries this heading.
 */
export function patchSnapshotTitle(html: string, title: string): { html: string; changed: boolean } {
  const m = H1_RE.exec(html);
  const next = title.trim();
  if (!m || !next) return { html, changed: false };
  const oldRaw = m[2].trim();
  const oldText = decodeEntities(oldRaw).trim();
  if (oldText === next) return { html, changed: false };

  const enc = encodeText(next);
  let out = html.replace(H1_RE, (_all, open: string, _inner: string, close: string) => open + enc + close);
  out = out.replace(CRUMB_RE, (all, open: string, inner: string, close: string) =>
    decodeEntities(inner).trim() === oldText ? open + enc + close : all,
  );
  if (oldRaw) out = out.split(`alt="${oldRaw}"`).join(`alt="${enc}"`);
  return { html: out, changed: true };
}

type SeoEntry = { url?: string; description?: string; [k: string]: unknown };

/**
 * Update the article's description in seo-meta.json - the <title>/<meta>
 * source while the snapshot renders. Only when the entry still holds the
 * description the admin last saw (`previous`): a hand-crafted SEO text is
 * never overwritten by a frontmatter edit. The file is byte-identical to
 * JSON.stringify(list, null, 2) + "\n", so parse/modify/stringify is safe.
 */
export function patchSeoDescription(
  json: string,
  url: string,
  previous: string,
  next: string,
): { json: string; changed: boolean } {
  let list: SeoEntry[];
  try {
    list = JSON.parse(json) as SeoEntry[];
  } catch {
    return { json, changed: false };
  }
  if (!Array.isArray(list)) return { json, changed: false };
  const entry = list.find((e) => e && e.url === url);
  const nextText = next.trim();
  if (!entry || !nextText) return { json, changed: false };
  const current = String(entry.description ?? "").trim();
  if (current === nextText || current !== previous.trim()) return { json, changed: false };
  entry.description = nextText;
  return { json: JSON.stringify(list, null, 2) + "\n", changed: true };
}
