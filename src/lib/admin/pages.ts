import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { PageRow } from "./page-types";
import { classifyPage } from "./page-types";
import { listPageFilesGitHub } from "./page-store";

const PAGES_DIR = join(process.cwd(), "public/pages");

/**
 * Server-only: enumerates HTML files in public/pages/ and classifies each.
 *
 * Rich fields (Lighthouse, indexed, last-built, broken-links) come later
 * when the respective integrations are wired. For now we expose what's
 * directly observable: type, URL, size, mtime.
 */

// classifyPage lives in page-types.ts (client-safe, the duplicate dialog
// previews it); re-exported here so server code keeps one import site.
export { classifyPage };

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
export async function listPagesFresh(): Promise<PageRow[]> {
  const local = listPages();
  const remote = await listPageFilesGitHub();
  if (!remote) return local;
  // On Vercel every file's mtime is the build time, so it says nothing
  // about the page; the caller overlays git-derived activity dates.
  return remote.map((f) => {
    const slug = f.name.replace(/\.html$/, "");
    const { type, url } = classifyPage(slug);
    return { type, slug, url, bytes: f.size, mtime: null };
  });
}

// Re-export for convenience — server code can grab everything from one place.
export type { PageRow, PageType } from "./page-types";
export { pageTypeLabel } from "./page-types";
