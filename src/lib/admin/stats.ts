import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { listSlugsGitHub, readPost } from "./content-store";

const BLOG_DIR = join(process.cwd(), "src/data/blog");
const PAGES_DIR = join(process.cwd(), "public/pages");
const CITIES_DIR = join(process.cwd(), "src/data/cities");
const SERVICES_DIR = join(process.cwd(), "src/data/services");

/**
 * Admin-only stats helpers. Plain fs reads at build/request time —
 * no DB needed for Phase 1 so the panel has real numbers to render.
 */

export type PostRow = {
  slug: string;
  title: string;
  category: string;
  publishDate: string;
  lastUpdated: string;
  status: "published" | "draft" | "scheduled";
  publishAt?: string;
};

function rowFromFrontmatter(slug: string, data: Record<string, unknown>): PostRow {
  const draft = data.draft === true;
  const publishAtRaw = typeof data.publishAt === "string" ? data.publishAt : undefined;
  const publishAt = publishAtRaw ? new Date(publishAtRaw) : null;
  const now = new Date();

  let status: PostRow["status"] = "published";
  if (draft && publishAt && publishAt > now) status = "scheduled";
  else if (draft) status = "draft";

  return {
    slug,
    title: (data.title as string) || slug,
    category: (data.category as string) || "—",
    publishDate: (data.publishDate as string) || "",
    lastUpdated: (data.lastUpdated as string) || (data.publishDate as string) || "",
    status,
    publishAt: publishAtRaw,
  };
}

/**
 * Post rows for the admin. Base: local fs (state of the last build).
 * Freshness: merged with GitHub's live directory listing, because the
 * serverless fs doesn't see posts created/deleted through the admin
 * until the triggered rebuild finishes — without the merge a freshly
 * created draft is missing from the list for a couple of minutes.
 */
export async function getAllPosts(limit?: number): Promise<PostRow[]> {
  const rows = new Map<string, PostRow>();
  for (const file of readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"))) {
    const slug = file.replace(/\.md$/, "");
    try {
      const { data } = matter(readFileSync(join(BLOG_DIR, file), "utf-8"));
      rows.set(slug, rowFromFrontmatter(slug, data));
    } catch {
      // skip unreadable file
    }
  }

  const ghSlugs = await listSlugsGitHub();
  if (ghSlugs) {
    const gh = new Set(ghSlugs);
    // deleted via the admin since the last build
    for (const slug of [...rows.keys()]) if (!gh.has(slug)) rows.delete(slug);
    // created via the admin since the last build
    const fresh = ghSlugs.filter((s) => !rows.has(s));
    const posts = await Promise.all(fresh.map((s) => readPost(s).catch(() => null)));
    posts.forEach((post, i) => {
      if (post) {
        rows.set(fresh[i], rowFromFrontmatter(fresh[i], post.frontmatter as unknown as Record<string, unknown>));
      }
    });
  }

  const sorted = [...rows.values()].sort(
    (a, b) => (new Date(b.publishDate).getTime() || 0) - (new Date(a.publishDate).getTime() || 0),
  );
  return limit ? sorted.slice(0, limit) : sorted;
}

export type SiteStats = {
  totalPages: number;
  totalBlogPosts: number;
  totalCities: number;
  totalServices: number;
  pagesByType: { type: string; count: number }[];
  lastBuildHint: string;
};

export function getSiteStats(): SiteStats {
  const pageFiles = readdirSync(PAGES_DIR).filter((f) => f.endsWith(".html"));
  const blogPosts = readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md")).length;
  const cities = readdirSync(CITIES_DIR).filter((f) => f.endsWith(".json")).length;
  const services = readdirSync(SERVICES_DIR).filter((f) => f.endsWith(".json") && !f.startsWith("_")).length;

  // Bucket by naming convention from PROJECT-CONTEXT.md
  const buckets: Record<string, number> = {
    "Главная": 0,
    "Города": 0,
    "Movers-*": 0,
    "Услуги": 0,
    "Блог": 0,
    "About Us": 0,
    "Формы": 0,
    "Прочее": 0,
  };
  for (const f of pageFiles) {
    const name = f.replace(/\.html$/, "");
    if (name === "index") buckets["Главная"]++;
    else if (name.endsWith("-movers") && !name.startsWith("movers-")) buckets["Города"]++;
    else if (name.startsWith("movers-")) buckets["Movers-*"]++;
    else if (name.startsWith("services__") || name === "services" || name === "moving-services") buckets["Услуги"]++;
    else if (name.startsWith("blog__") || name === "blog") buckets["Блог"]++;
    else if (name.startsWith("about-us")) buckets["About Us"]++;
    else if (name === "free-estimate" || name === "book-online") buckets["Формы"]++;
    else buckets["Прочее"]++;
  }

  // last build hint = mtime of .next/BUILD_ID if present, else "never"
  let lastBuildHint = "—";
  try {
    const buildId = join(process.cwd(), ".next/BUILD_ID");
    const st = statSync(buildId);
    const diff = Date.now() - st.mtimeMs;
    const mins = Math.round(diff / 60_000);
    if (mins < 60) lastBuildHint = `${mins} мин назад`;
    else if (mins < 1440) lastBuildHint = `${Math.round(mins / 60)} ч назад`;
    else lastBuildHint = `${Math.round(mins / 1440)} д назад`;
  } catch {
    /* dev mode — no build yet */
  }

  return {
    totalPages: pageFiles.length,
    totalBlogPosts: blogPosts,
    totalCities: cities,
    totalServices: services,
    pagesByType: Object.entries(buckets)
      .filter(([, c]) => c > 0)
      .map(([type, count]) => ({ type, count })),
    lastBuildHint,
  };
}

export async function getScheduledPosts(): Promise<PostRow[]> {
  return (await getAllPosts()).filter((p) => p.status === "scheduled");
}

export async function getRecentPosts(n = 8): Promise<PostRow[]> {
  return getAllPosts(n);
}
