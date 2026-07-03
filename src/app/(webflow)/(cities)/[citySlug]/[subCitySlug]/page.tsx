import { notFound } from 'next/navigation';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { Metadata } from 'next';
import { renderPage } from '@/lib/render-page';
import { metaForPath } from '@/lib/seo-meta';

/**
 * Nested city route: /los-angeles-movers/burbank-movers, /los-angeles-movers/calabasas-movers, etc.
 * Maps /<parent>/<child> → public/pages/<parent>__<child>.html
 */
export async function generateStaticParams() {
  const dir = join(process.cwd(), 'public/pages');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.html') && f.includes('__') && f.includes('-movers'))
    .filter((f) => {
      // Only map nested city pages (parent must itself be a *-movers slug, child too)
      const [parent, child] = f.replace('.html', '').split('__');
      return Boolean(parent && child && parent.endsWith('-movers') && child.endsWith('-movers'));
    })
    .map((f) => {
      const [parent, child] = f.replace('.html', '').split('__');
      return { citySlug: parent, subCitySlug: child };
    });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ citySlug: string; subCitySlug: string }>;
}): Promise<Metadata> {
  const { citySlug, subCitySlug } = await params;
  return metaForPath(`/${citySlug}/${subCitySlug}`);
}

export default async function NestedCityPage({
  params,
}: {
  params: Promise<{ citySlug: string; subCitySlug: string }>;
}) {
  const { citySlug, subCitySlug } = await params;
  const pageSlug = `${citySlug}__${subCitySlug}`;
  if (!existsSync(join(process.cwd(), 'public/pages', `${pageSlug}.html`))) {
    notFound();
  }
  return renderPage(pageSlug);
}
