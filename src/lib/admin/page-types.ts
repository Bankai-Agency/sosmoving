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
  mtime: Date;
};

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
