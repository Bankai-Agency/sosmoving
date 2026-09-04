import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { PageRow, PageType } from "./page-types";
import { listPageFilesGitHub } from "./page-store";

const PAGES_DIR = join(process.cwd(), "public/pages");

/**
 * Server-only: enumerates HTML files in public/pages/ and classifies each.
 *
 * Rich fields (Lighthouse, indexed, last-built, broken-links) come later
 * when the respective integrations are wired. For now we expose what's
 * directly observable: type, URL, size, mtime.
 */

export function classifyPage(slug: string): { type: PageType; url: string } {
  if (slug === "index") return { type: "home", url: "/" };
  if (slug === "services") return { type: "services-listing", url: "/services" };
  if (slug === "moving-services") return { type: "moving-services", url: "/moving-services" };
  if (slug === "blog") return { type: "blog-index", url: "/blog" };
  if (slug === "sitemap") return { type: "sitemap", url: "/sitemap" };
  if (slug === "free-estimate" || slug === "book-online") return { type: "form", url: `/${slug}` };
  if (slug.startsWith("services__")) {
    const s = slug.replace("services__", "");
    return { type: "service", url: `/services/${s}` };
  }
  if (slug.startsWith("blog__")) {
    const s = slug.replace("blog__", "");
    return { type: "blog-post", url: `/blog/${s}` };
  }
  if (slug.startsWith("about-us")) {
    const s = slug === "about-us" ? "" : `/${slug.replace("about-us__", "")}`;
    return { type: "about", url: `/about-us${s}` };
  }
  if (slug.includes("__")) {
    // Nested city pages: los-angeles-movers__burbank-movers.html -> /los-angeles-movers/burbank-movers
    const [parent, child] = slug.split("__");
    if (parent.endsWith("-movers") && child && child.endsWith("-movers")) {
      return { type: "city", url: `/${parent}/${child}` };
    }
  }
  if (slug.startsWith("movers-")) return { type: "movers-city", url: `/${slug}` };
  if (slug.endsWith("-movers")) return { type: "city", url: `/${slug}` };
  if (slug.startsWith("confirmation-page")) return { type: "confirmation", url: `/${slug}` };
  return { type: "other", url: `/${slug}` };
}

export function listPages(): PageRow[] {
  let files: string[] = [];
  try {
    files = readdirSync(PAGES_DIR).filter((f) => f.endsWith(".html"));
  } catch {
    return [];
  }
  const rows: PageRow[] = [];
  for (const f of files) {
    const slug = f.replace(/\.html$/, "");
    const { type, url } = classifyPage(slug);
    try {
      const st = statSync(join(PAGES_DIR, f));
      rows.push({ type, slug, url, bytes: st.size, mtime: st.mtime });
    } catch {
      rows.push({ type, slug, url, bytes: 0, mtime: new Date(0) });
    }
  }
  rows.sort((a, b) => (b.mtime?.getTime() ?? 0) - (a.mtime?.getTime() ?? 0));
  return rows;
}

/**
 * listPages() as GitHub sees the branch right now. On Vercel the fs only
 * has the last build, so a page duplicated or deleted through the admin
 * a minute ago would be missing from (or linger in) the fs listing. Falls
 * back to the fs listing in dev or when GitHub is unreachable.
 */
export async function listPagesFresh(activity: Map<string, Date> = new Map()): Promise<PageRow[]> {
  const local = listPages();
  const remote = await listPageFilesGitHub();
  if (!remote) return local;
  // On Vercel every file's mtime is the build time, so it says nothing
  // about the page; the git-derived activity map does. Pages nobody
  // touched through the admin recently sort after, alphabetically.
  const rows: PageRow[] = remote.map((f) => {
    const slug = f.name.replace(/\.html$/, "");
    const { type, url } = classifyPage(slug);
    return { type, slug, url, bytes: f.size, mtime: activity.get(slug) ?? null };
  });
  rows.sort((a, b) => (b.mtime?.getTime() ?? 0) - (a.mtime?.getTime() ?? 0) || a.url.localeCompare(b.url));
  return rows;
}

// Re-export for convenience — server code can grab everything from one place.
export type { PageRow, PageType } from "./page-types";
export { pageTypeLabel } from "./page-types";
