import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

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

export function getAllPosts(limit?: number): PostRow[] {
  const slugs = readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
  const rows: PostRow[] = [];
  for (const file of slugs) {
    try {
      const { data } = matter(readFileSync(join(BLOG_DIR, file), "utf-8"));
      const draft = data.draft === true;
      const publishAt = data.publishAt ? new Date(data.publishAt) : null;
      const now = new Date();

      let status: PostRow["status"] = "published";
      if (draft && publishAt && publishAt > now) status = "scheduled";
      else if (draft) status = "draft";

      rows.push({
        slug: file.replace(/\.md$/, ""),
        title: data.title || file,
        category: data.category || "—",
        publishDate: data.publishDate || "",
        lastUpdated: data.lastUpdated || data.publishDate || "",
        status,
        publishAt: data.publishAt,
      });
    } catch {
      // skip unreadable file
    }
  }
  // newest first
  rows.sort((a, b) => (new Date(b.publishDate).getTime() || 0) - (new Date(a.publishDate).getTime() || 0));
  return limit ? rows.slice(0, limit) : rows;
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

export function getScheduledPosts(): PostRow[] {
  return getAllPosts().filter((p) => p.status === "scheduled");
}

export function getRecentPosts(n = 8): PostRow[] {
  return getAllPosts(n);
}
