/**
 * Client-safe types + labels for the "Pages health" feature.
 *
 * Exported separately from ./pages.ts because that file imports node:fs
 * (which can't be bundled into client components). PagesTable.tsx imports
 * only this file.
 */

export type PageType =
  | "home"
  | "city"
  | "movers-city"
  | "service"
  | "services-listing"
  | "moving-services"
  | "blog-index"
  | "blog-post"
  | "about"
  | "form"
  | "sitemap"
  | "confirmation"
  | "other";

export type PageRow = {
  type: PageType;
  slug: string;
  url: string;
  bytes: number;
  /** Last admin change from git on Vercel, fs mtime in dev; null when unknown. */
  mtime: Date | null;
};

/**
 * Slug -> page type + public url. Pure string logic, so the duplicate dialog
 * can preview what a slug will become before anything is written.
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

export function pageTypeLabel(t: PageType): string {
  switch (t) {
    case "home": return "Главная";
    case "city": return "Город";
    case "movers-city": return "Movers-* (alt)";
    case "service": return "Услуга";
    case "services-listing": return "Услуги (листинг)";
    case "moving-services": return "Moving Services";
    case "blog-index": return "Блог (листинг)";
    case "blog-post": return "Блог-пост";
    case "about": return "About Us";
    case "form": return "Форма";
    case "sitemap": return "Sitemap";
    case "confirmation": return "Confirmation";
    case "other": return "Прочее";
  }
}

/**
 * Human name guessed from a page slug - the default "replace from/to" pair
 * of the duplicate dialog. "eastvale-movers" -> "Eastvale",
 * "movers-hollywood" -> "Hollywood", "los-angeles-movers__burbank-movers"
 * -> "Burbank", "services__packing-services" -> "Packing Services".
 * A guess only: the editor sees and can correct it before duplicating.
 */
export function guessPageName(slug: string): string {
  const last = slug.includes("__") ? slug.split("__").pop() ?? slug : slug;
  const core = last.replace(/^movers-/, "").replace(/-movers$/, "");
  return core
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Pages the admin must never delete: structural routes (home, listings,
 * forms, confirmations) and blog posts, which live in the blog section
 * with their own markdown-aware delete.
 */
export const NON_DELETABLE_TYPES = new Set<PageType>([
  "home",
  "services-listing",
  "moving-services",
  "blog-index",
  "blog-post",
  "sitemap",
  "form",
  "confirmation",
]);
