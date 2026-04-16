import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import type { BlogPostCard } from '@/lib/types';

export function LatestNewsSection({ posts }: { posts: BlogPostCard[] }) {
  if (!posts.length) return null;

  return (
    <section className="py-16">
      <Container>
        <h2 className="text-[1.75rem] font-bold mb-8">Latest News</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.slice(0, 6).map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block bg-card-bg rounded-xl overflow-hidden hover:bg-card-bg-hover transition-colors"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                {post.featuredImage ? (
                  <Image
                    src={post.featuredImage}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full bg-dim-grey/20" />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 text-[0.55rem] text-text-muted mb-2">
                  {post.publishDate && <span>{post.publishDate}</span>}
                  {post.readTime && (
                    <>
                      <span>|</span>
                      <span>{post.readTime}</span>
                    </>
                  )}
                </div>
                <h3 className="text-white text-[0.75rem] font-bold group-hover:text-accent transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <span className="inline-block mt-3 text-accent text-[0.65rem] font-bold">
                  Read more &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
