import Image from 'next/image';
import Link from 'next/link';
import type { BlogPostCard } from '@/lib/types';

export function BlogCard({ post }: { post: BlogPostCard }) {
  return (
    <Link
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
          <div className="w-full h-full bg-dim-grey/20 flex items-center justify-center">
            <span className="text-dim-grey text-[0.7rem]">SOS Moving</span>
          </div>
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
        <h3 className="text-white text-[0.75rem] font-bold group-hover:text-accent transition-colors line-clamp-2 mb-2">
          {post.title}
        </h3>
        <p className="text-[0.65rem] text-text-muted line-clamp-2">
          {post.excerpt}
        </p>
        <span className="inline-block mt-3 text-accent text-[0.65rem] font-bold">
          Read more &rarr;
        </span>
      </div>
    </Link>
  );
}
