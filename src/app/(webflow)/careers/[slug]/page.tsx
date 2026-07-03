import { notFound } from 'next/navigation';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { Metadata } from 'next';
import { renderPage } from '@/lib/render-page';
import { metaForPath } from '@/lib/seo-meta';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return metaForPath(`/careers/${slug}`);
}

export async function generateStaticParams() {
  const dir = join(process.cwd(), 'public/pages');
  return readdirSync(dir)
    .filter(f => f.startsWith('careers__') && f.endsWith('.html'))
    .map(f => ({ slug: f.replace('careers__', '').replace('.html', '') }));
}

export default async function CareerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pageSlug = `careers__${slug}`;
  if (!existsSync(join(process.cwd(), 'public/pages', `${pageSlug}.html`))) notFound();
  return renderPage(pageSlug);
}
