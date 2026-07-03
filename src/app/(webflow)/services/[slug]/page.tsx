import { notFound } from 'next/navigation';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { Metadata } from 'next';
import { renderPage } from '@/lib/render-page';
import { metaForPath, JsonLd } from '@/lib/seo-meta';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return metaForPath(`/services/${slug}`);
}

export async function generateStaticParams() {
  const dir = join(process.cwd(), 'public/pages');
  return readdirSync(dir)
    .filter(f => f.startsWith('services__') && f.endsWith('.html'))
    .map(f => ({ slug: f.replace('services__', '').replace('.html', '') }));
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pageSlug = `services__${slug}`;
  if (!existsSync(join(process.cwd(), 'public/pages', `${pageSlug}.html`))) notFound();
  return (
    <>
      <JsonLd path={`/services/${slug}`} />
      {renderPage(pageSlug)}
    </>
  );
}
