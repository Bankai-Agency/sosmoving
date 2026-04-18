import { notFound } from 'next/navigation';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { Metadata } from 'next';
import { renderPage } from '@/lib/render-page';

// Per-city meta descriptions. Only cities with custom copy are listed —
// anything not here falls back to the site-wide default from (webflow)/layout.tsx.
const CITY_META: Record<string, string> = {
  'beverly-hills-movers':
    'Top-rated Beverly Hills movers — licensed & insured, from $119/hr. HOA-compliant, hillside navigation experts. 4.9★ Google rated. Free quote.',
  'orange-county-movers':
    'Licensed Orange County movers from $119/hr. Serving Irvine, Newport Beach, Laguna, Huntington Beach & all OC. 4.9★ on Google. Free estimate.',
  'portland-movers':
    'Professional Portland movers — licensed & insured. Local and long-distance moves across Oregon. 4.9★ rated. Get your free moving quote today.',
  'denver-movers':
    'Denver movers from $125/hr — licensed, insured, full-service. Local and long-distance moves across Colorado. 4.9★ Google rated. Free estimate.',
};

export async function generateStaticParams() {
  const dir = join(process.cwd(), 'public/pages');
  return readdirSync(dir)
    .filter(f => f.endsWith('.html') && f.includes('-movers') && !f.includes('__'))
    .map(f => ({ citySlug: f.replace('.html', '') }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ citySlug: string }> }
): Promise<Metadata> {
  const { citySlug } = await params;
  const description = CITY_META[citySlug];
  return description ? { description } : {};
}

export default async function CityPage({ params }: { params: Promise<{ citySlug: string }> }) {
  const { citySlug } = await params;
  const pagesDir = join(process.cwd(), 'public/pages');
  if (!existsSync(join(pagesDir, `${citySlug}.html`))) notFound();
  return renderPage(citySlug);
}
