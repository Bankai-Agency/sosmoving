import type { NextConfig } from "next";
import { readFileSync } from "fs";
import { join } from "path";

// 301s for URLs the scraped pages used to link before the hrefs were fixed
// (blog posts without the /blog/ prefix, nested city pages by their flat
// slug — see scripts/fix-broken-links.mjs). The links themselves are fixed
// at the source; these redirects catch anything external that picked the
// wrong URLs up while they were live.
function brokenLinkRedirects() {
  return ["src/data/broken-links-map.csv", "src/data/broken-links-map-extra.csv"]
    .flatMap((f) =>
      readFileSync(join(__dirname, f), "utf8")
        .replace(/^﻿/, "")
        .split(/\r?\n/)
        .slice(1)
        .filter(Boolean),
    )
    .map((line) => line.split(","))
    .filter(([wrong, correct]) => wrong && correct)
    .map(([wrong, correct]) => ({
      source: wrong,
      destination: correct,
      permanent: true,
    }));
}

const nextConfig: NextConfig = {
  async redirects() {
    return brokenLinkRedirects();
  },
  async headers() {
    return [
      {
        // Content-hashed Webflow bundles — safe to cache forever. Default
        // Vercel policy for public/ is max-age=0 + revalidate on every load.
        source: "/webflow.:hash*.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/fonts/:file*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=2592000" },
        ],
      },
    ];
  },
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Keep admin-only heavy deps + static-asset folders out of serverless function
  // bundles. /api/upload was tracing `public/images/blog/` (262 MB of static
  // blog images) because image-store.ts calls join(process.cwd(), "public/...")
  // with existsSync — Next treats the referenced folder as a runtime dependency
  // and bundles the whole thing, blowing past the 250 MB Hobby function limit.
  // Public routes also previously dragged in @blocknote / drizzle / @octokit /
  // next-auth via transitive traces.
  outputFileTracingExcludes: {
    "/api/upload": [
      "public/**",
      ".next/**",
      "src/data/blog/**",
    ],
    "/api/cron/publish-scheduled": [
      "public/**",
      ".next/**",
    ],
    "/mainpage2": [
      "node_modules/@blocknote/**",
      "node_modules/@emotion/**",
      "node_modules/@mantine/**",
      "node_modules/@octokit/**",
      "node_modules/drizzle-orm/**",
      "node_modules/drizzle-kit/**",
      "node_modules/@neondatabase/**",
      "node_modules/bcryptjs/**",
      "node_modules/next-auth/**",
      "node_modules/cheerio/**",
    ],
    "/": [
      "node_modules/@blocknote/**",
      "node_modules/@emotion/**",
      "node_modules/@mantine/**",
      "node_modules/@octokit/**",
      "node_modules/drizzle-orm/**",
      "node_modules/drizzle-kit/**",
      "node_modules/@neondatabase/**",
      "node_modules/bcryptjs/**",
      "node_modules/next-auth/**",
      "node_modules/cheerio/**",
    ],
    "/blog/[slug]": [
      "node_modules/@blocknote/**",
      "node_modules/@emotion/**",
      "node_modules/@mantine/**",
      "node_modules/@octokit/**",
      "node_modules/drizzle-orm/**",
      "node_modules/drizzle-kit/**",
      "node_modules/@neondatabase/**",
      "node_modules/bcryptjs/**",
      "node_modules/cheerio/**",
    ],
    "/services/[slug]": [
      "node_modules/@blocknote/**",
      "node_modules/@emotion/**",
      "node_modules/@mantine/**",
      "node_modules/@octokit/**",
      "node_modules/drizzle-orm/**",
      "node_modules/drizzle-kit/**",
      "node_modules/@neondatabase/**",
      "node_modules/bcryptjs/**",
      "node_modules/cheerio/**",
    ],
    "/[citySlug]": [
      "node_modules/@blocknote/**",
      "node_modules/@emotion/**",
      "node_modules/@mantine/**",
      "node_modules/@octokit/**",
      "node_modules/drizzle-orm/**",
      "node_modules/drizzle-kit/**",
      "node_modules/@neondatabase/**",
      "node_modules/bcryptjs/**",
      "node_modules/cheerio/**",
    ],
    "/category/[slug]": [
      "node_modules/@blocknote/**",
      "node_modules/@emotion/**",
      "node_modules/@mantine/**",
      "node_modules/@octokit/**",
      "node_modules/drizzle-orm/**",
      "node_modules/drizzle-kit/**",
      "node_modules/@neondatabase/**",
      "node_modules/bcryptjs/**",
      "node_modules/cheerio/**",
    ],
  },
};

export default nextConfig;
