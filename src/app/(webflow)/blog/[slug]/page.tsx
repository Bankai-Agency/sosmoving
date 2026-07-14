import { notFound } from 'next/navigation';
import { existsSync } from 'fs';
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
  const post = getBlogPost(slug);
  // The pre-migration etalon wins only while the scraped snapshot is what
  // we render. Once the article is edited in the admin (renderFrom: md)
  // or when it never was in the etalon, the frontmatter is the truth —
  // otherwise an edited title would show in the H1 but never in <title>.
  if (meta.title && post?.renderFrom !== 'md') return meta;
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
  // md is the source of truth for a post's existence and publication —
  // every article (scraped or admin-authored) has an md file; drafts and
  // deleted posts are excluded by getAllBlogSlugs().
  return getAllBlogSlugs().map(slug => ({ slug }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug); // null → draft, unpublished or deleted
  if (!post) notFound();

  // Scraped html is pixel-perfect presentation — it wins until the article
  // is edited in the admin (savePost stamps renderFrom: "md", making
  // markdown the truth). Existence/publication is md's call either way,
  // so Unpublish/Delete in the admin actually take a page off the site.
  const pageSlug = `blog__${slug}`;
  const hasHtml = existsSync(join(process.cwd(), 'public/pages', `${pageSlug}.html`));
  if (hasHtml && post.renderFrom !== 'md') return renderPage(pageSlug);
  return <MdArticle fm={post} content={post.content} />;
}
