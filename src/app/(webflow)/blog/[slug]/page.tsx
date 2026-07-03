import { notFound } from 'next/navigation';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { Metadata } from 'next';
import { renderPage } from '@/lib/render-page';
import { metaForPath } from '@/lib/seo-meta';
import { getBlogPost } from '@/lib/data/blog';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = metaForPath(`/blog/${slug}`);
  if (meta.title) return meta;
  // Articles written after the migration are not in the pre-migration
  // etalon (seo-meta.json) — their meta comes from the md frontmatter.
  const post = getBlogPost(slug);
  if (!post) return meta;
  return {
    ...meta,
    title: { absolute: post.title },
    description: post.metaDescription,
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      url: `/blog/${slug}`,
      type: 'article',
      ...(post.featuredImage ? { images: [post.featuredImage] } : {}),
    },
  };
}

export async function generateStaticParams() {
  const dir = join(process.cwd(), 'public/pages');
  return readdirSync(dir)
    .filter(f => f.startsWith('blog__') && f.endsWith('.html'))
    .map(f => ({ slug: f.replace('blog__', '').replace('.html', '') }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pageSlug = `blog__${slug}`;
  if (!existsSync(join(process.cwd(), 'public/pages', `${pageSlug}.html`))) notFound();
  return renderPage(pageSlug);
}
