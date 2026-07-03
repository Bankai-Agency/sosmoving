import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
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
  const { posts, totalPages } = getBlogPosts({ page, limit: 12, category: slug });

  const title = categoryTitle(slug);

  return (
    <>
      <section className="pt-[5rem] pb-8 bg-gradient-to-b from-card-bg to-black">
        <Container>
          <h1 className="text-white text-[2rem] md:text-[2.8rem] font-black leading-tight mb-3">
            {title}
          </h1>
          <p className="text-white/60 text-[0.8rem]">
            {posts.length} articles in this category
          </p>
        </Container>
      </section>

      <section className="py-12">
        <Container>
          {posts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {posts.map((post) => (
                  <BlogCard key={post.slug} post={post} />
                ))}
              </div>
              <Pagination currentPage={page} totalPages={totalPages} basePath={`/category/${slug}`} />
            </>
          ) : (
            <p className="text-center text-[0.8rem] py-20">No articles found in this category.</p>
          )}
        </Container>
      </section>
    </>
  );
}
