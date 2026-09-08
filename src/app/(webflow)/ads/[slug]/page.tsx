import { notFound } from 'next/navigation';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { Metadata } from 'next';
import { renderPage } from '@/lib/render-page';
import { metaForPath } from '@/lib/seo-meta';

/**
 * Ad landing copies: /ads/<slug> -> public/pages/ads__<slug>.html.
 *
 * Duplicates of city pages that paid campaigns land on. They must never
 * reach the index or the site graph, so they are closed at every layer:
 * `<meta name="robots" content="noindex, nofollow">` here, the X-Robots-Tag
 * header in next.config.ts, `Disallow: /ads/` in robots.txt, no registry
 * entry (hence no sitemap), no JSON-LD, and no link from any other page -
 * the copies even keep their self-links pointing at the original page (see
 * planDuplicate). The admin edits them like any city page.
 */
export async function generateStaticParams() {
  const dir = join(process.cwd(), 'public/pages');
  return readdirSync(dir)
    .filter((f) => f.startsWith('ads__') && f.endsWith('.html'))
    .map((f) => ({ slug: f.replace(/^ads__/, '').replace(/\.html$/, '') }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const noindex = { index: false, follow: false, nocache: true };
  return metaForPath(`/ads/${slug}`, { robots: { ...noindex, googleBot: noindex } });
}

export default async function AdLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pageSlug = `ads__${slug}`;
  if (!existsSync(join(process.cwd(), 'public/pages', `${pageSlug}.html`))) notFound();
  return renderPage(pageSlug);
}
