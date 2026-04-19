import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Keep admin-only heavy deps out of every other serverless function bundle.
  // Without this, public routes (mainpage2, city, service, blog) were tracing
  // in @blocknote / drizzle / next-auth / @octokit and hitting Vercel Hobby's
  // 250 MB per-function unzipped limit, blocking all production deploys.
  outputFileTracingExcludes: {
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
