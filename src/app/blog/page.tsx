import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { BlogCard } from '@/components/blog/BlogCard';
import { Pagination } from '@/components/blog/Pagination';
import { getBlogPosts } from '@/lib/data/blog';

export const metadata: Metadata = {
  title: 'Moving Tips, Guides & Expert Advice',
  description:
    'Expert moving tips, packing guides, and relocation advice from SOS Moving & Storage. Everything you need for a successful move.',
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam) || 1;
  const { posts, totalPages } = getBlogPosts({ page, limit: 12 });

  return (
    <>
      {/* Hero */}
      <section className="pt-[5rem] pb-8 bg-gradient-to-b from-card-bg to-black">
        <Container>
          <h1 className="text-white text-[2rem] md:text-[2.8rem] font-black leading-tight mb-3">
            Moving Tips, Guides
            <br />& Expert Advice
          </h1>
          <p className="text-white/60 text-[0.8rem] max-w-lg">
            Expert advice to help you prepare, pack, and settle into your new
            home.
          </p>
        </Container>
      </section>

      {/* Posts grid */}
      <section className="py-12">
        <Container>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath="/blog"
          />
        </Container>
      </section>
    </>
  );
}
