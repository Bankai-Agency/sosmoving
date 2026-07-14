import type { Metadata } from 'next';
import { readFileSync } from 'fs';
import { join } from 'path';
import seoMeta from '@/data/seo-meta.json';

/**
 * SEO parity layer for the Webflow → Next.js migration.
 *
 * `src/data/seo-meta.json` is the source of truth scraped from the live
 * pre-migration site (www.sosmovingla.net, captured 2026-07-03): one entry
 * per sitemap URL with the exact title/description/canonical/OG/Twitter/
 * robots values each page ranked with. Every (webflow) route resolves its
 * metadata through metaForPath() so the server HTML carries the same head
 * the old site had. See src/data/broken-links-map*.csv and the fix brief
 * for the rest of the migration spec.
 */

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

const BY_URL = new Map<string, SeoEntry>(
  (seoMeta as SeoEntry[]).map((e) => [e.url, e]),
);

/**
 * Metadata for a route path ("/torrance-movers"). Pages not present in the
 * old site's sitemap still get a self-referencing canonical so nothing new
 * ships without one. `overrides` wins over scraped values — used by pages
 * whose description was deliberately rewritten post-migration
 * (site-edits.md) so those improvements are not rolled back.
 */
export function metaForPath(path: string, overrides: Metadata = {}): Metadata {
  const e = BY_URL.get(path);
  const meta: Metadata = {
    alternates: { canonical: path },
  };
  if (e) {
    // Old titles are complete (brand included) — bypass the layout template.
    meta.title = { absolute: e.title };
    meta.description = e.description;
    if (e.robots.includes('noindex')) {
      // Parity: the old site deliberately noindexed a few near-duplicate
      // pages (/la-movers, /local-movers, /moving-services). Keep that.
      meta.robots = { index: false, follow: e.robots.includes('follow') };
    }
    // Deliberate post-migration improvement (like the description rewrites):
    // the old site had no OG on the homepage and blog articles, so shares
    // in messengers/socials rendered without a preview. Etalon og values
    // win when present; otherwise synthesize from title/description.
    meta.openGraph = {
      title: e.og['og:title'] ?? e.title,
      description: e.og['og:description'] ?? e.description,
      url: path,
      type: 'website',
      ...(e.og['og:image'] ? { images: [e.og['og:image']] } : {}),
    };
    if (Object.keys(e.twitter).length > 0) {
      meta.twitter = {
        card: 'summary_large_image',
        title: e.twitter['twitter:title'] ?? e.title,
        description: e.twitter['twitter:description'] ?? e.description,
        ...(e.og['og:image'] ? { images: [e.og['og:image']] } : {}),
      };
    }
  }
  return {
    ...meta,
    ...overrides,
    alternates: { ...meta.alternates, ...overrides.alternates },
  };
}

/**
 * Server component: emits the page's pre-migration JSON-LD block
 * (src/data/jsonld/*.json, mapped via seo-meta.json → jsonldFile).
 * Renders nothing for pages that had no structured data.
 */
export function JsonLd({ path }: { path: string }) {
  const file = BY_URL.get(path)?.jsonldFile;
  if (!file) return null;
  const name = file.replace('data/jsonld/', '');
  const block = readFileSync(
    join(process.cwd(), 'src/data/jsonld', name),
    'utf8',
  );
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON.parse(block)) }}
    />
  );
}
