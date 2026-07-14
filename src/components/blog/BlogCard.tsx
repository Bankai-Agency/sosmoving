import Link from 'next/link';
import type { BlogPostCard } from '@/lib/types';

/**
 * Article card in the site's Webflow markup (classes from the scraped
 * /blog listing — blog-short-item / ln-slide-*). The (webflow) route
 * group has no Tailwind, so only webflow.css classes render here.
 */
export function BlogCard({ post }: { post: BlogPostCard }) {
  return (
    <div role="listitem" className="blog-short-item w-dyn-item">
      <Link
        href={`/blog/${post.slug}`}
        className="ln-slide-item is-blog-short-news-link w-inline-block"
      >
        <div className="ln-slide-image">
          {post.featuredImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.featuredImage}
              loading="lazy"
              alt={post.title}
              className="ln-slide-img"
            />
          ) : null}
        </div>
        <div className="blog-short-news-info">
          {post.publishDate && <div>{post.publishDate}</div>}
          {post.readTime && (
            <>
              <div className="blog-short-news-info-delimetr"></div>
              <div>{post.readTime}</div>
            </>
          )}
        </div>
        <h3 className="ln-slide-h3 is-blog-short-news-h3">{post.title}</h3>
        <div className="blog-short-text">{post.excerpt}</div>
        <div className="ln-slide-read-more-wrap">
          <div>Read more</div>
          <div className="ln-slide-rm-arrow w-embed">
            <svg width="1em" height="1em" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.4358 9.38154L2.73001 9.38158" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11.0162 14.3536L15.7986 9.57122C15.9106 9.45921 15.9105 9.2776 15.7986 9.16562L11.0295 4.3966" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </Link>
    </div>
  );
}
