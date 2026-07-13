import { notFound } from 'next/navigation';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { Metadata } from 'next';
import { renderPage } from '@/lib/render-page';
import { metaForPath } from '@/lib/seo-meta';
import { getBlogPost, getAllBlogSlugs } from '@/lib/data/blog';
import { MdArticle } from '@/components/blog/MdArticle';

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
  const htmlSlugs = readdirSync(dir)
    .filter(f => f.startsWith('blog__') && f.endsWith('.html'))
    .map(f => f.replace('blog__', '').replace('.html', ''));
  // md-authored posts (new articles from the admin) may have no scraped html
  const slugs = new Set([...htmlSlugs, ...getAllBlogSlugs()]);
  return [...slugs].map(slug => ({ slug }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pageSlug = `blog__${slug}`;
  const hasHtml = existsSync(join(process.cwd(), 'public/pages', `${pageSlug}.html`));
  const post = getBlogPost(slug);

  // Scraped html is pixel-perfect — it wins until the article is edited in
  // the admin (savePost stamps renderFrom: "md", making markdown the truth).
  if (hasHtml && post?.renderFrom !== 'md') return renderPage(pageSlug);
  if (post) return <MdArticle fm={post} content={post.content} />;
  notFound();
}
