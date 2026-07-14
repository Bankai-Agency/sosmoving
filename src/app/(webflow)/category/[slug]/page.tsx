import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { BlogCard } from '@/components/blog/BlogCard';
import { Pagination } from '@/components/blog/Pagination';
import { getBlogPosts } from '@/lib/data/blog';
import { getCategories } from '@/lib/data/shared';
import { metaForPath } from '@/lib/seo-meta';

export async function generateStaticParams() {
  const categories = getCategories();
  return categories.map((cat) => ({ slug: cat }));
}

// Display names that naive word-capitalization gets wrong
// ("After The Move", "Long Distance", "Top Places To Live").
const CATEGORY_TITLES: Record<string, string> = {
  'after-the-move': 'After the Move',
  'long-distance': 'Long-Distance',
  'top-places-to-live': 'Top Places to Live',
};

function categoryTitle(slug: string): string {
  return (
    CATEGORY_TITLES[slug] ??
    slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const title = categoryTitle(slug);
  // Pre-migration meta wins when the category existed on the old site;
  // the generated title/description only covers categories added since.
  const meta = metaForPath(`/category/${slug}`);
  return {
    title: `${title} — Blog`,
    description: `Articles about ${title.toLowerCase()} from SOS Moving & Storage.`,
    ...Object.fromEntries(Object.entries(meta).filter(([, v]) => v !== undefined)),
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam) || 1;
  const { posts, total, totalPages } = getBlogPosts({ page, limit: 12, category: slug });

  const title = categoryTitle(slug);

  // Webflow markup throughout — the (webflow) route group ships no
  // Tailwind, so the styles must come from webflow.css (same classes as
  // the scraped /blog listing).
  return (
    <>
      <div className="services-hero-section is-blog-article-hero is-without-bg-image">
        <div className="container services-hero-container w-container">
          <div className="breadcrumbs">
            <a href="/" className="breadcrumbs-link">Home</a>
            <div className="text-size-14 weight-700 text-color">&gt;</div>
            <a href="/blog" className="breadcrumbs-link">Blog</a>
            <div className="text-size-14 weight-700 text-color">&gt;</div>
            <span aria-current="page" className="breadcrumbs-link w--current">{title}</span>
          </div>
          <h1 className="services-hero-h1 is-blog-article-h1">{title}</h1>
          <div className="section-subtitle">
            <div>{total} articles in this category</div>
          </div>
        </div>
      </div>

      <div className="blog-section">
        <div className="container w-container">
          {posts.length > 0 ? (
            <>
              <div className="blog-short-news-wrap w-dyn-list">
                <div role="list" className="blog-short-news-list w-dyn-items">
                  {posts.map((post) => (
                    <BlogCard key={post.slug} post={post} />
                  ))}
                </div>
              </div>
              <Pagination currentPage={page} totalPages={totalPages} basePath={`/category/${slug}`} />
            </>
          ) : (
            <div className="section-subtitle">
              <div>No articles found in this category.</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
