import { marked } from 'marked';

type Frontmatter = {
  title?: string;
  lastUpdated?: string;
  featuredImage?: string;
};

/**
 * Renders a markdown-authored article inside the production blog-post
 * chrome (breadcrumbs → H1 → hero image → article body). Markdown becomes
 * HTML via `marked` and lands in the same `article-content-area w-richtext`
 * container the scraped posts use, so Webflow prose styles apply unchanged.
 *
 * Used by the public /blog/[slug] route for md-sourced posts (new articles
 * from the admin, or old ones re-saved there — renderFrom: "md") and by
 * /preview/blog/[slug] for drafts.
 */
export function MdArticle({ fm, content }: { fm: Frontmatter; content: string }) {
  const html = marked.parse(content, { async: false }) as string;

  return (
    <div className="services-hero-section is-blog-article-hero is-without-bg-image">
      <div className="container services-hero-container w-container">
        <div className="breadcrumbs">
          <a href="/" className="breadcrumbs-link">
            Home
          </a>
          <div className="text-size-14 weight-700 text-color">&gt;</div>
          <a href="/blog" className="breadcrumbs-link">
            Blog
          </a>
          <div className="text-size-14 weight-700 text-color">&gt;</div>
          <span aria-current="page" className="breadcrumbs-link w--current">
            {fm.title}
          </span>
        </div>

        <h1 className="services-hero-h1 is-blog-article-h1 is-small">{fm.title}</h1>

        {fm.lastUpdated && (
          <div className="section-subtitle is-blog-article">
            <div>Last Updated:&nbsp;</div>
            <div>{fm.lastUpdated}</div>
          </div>
        )}

        <div className="article-content-wrapper is-blog-page">
          {fm.featuredImage && (
            <div className="article-image-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                loading="lazy"
                alt={fm.title ?? ''}
                src={fm.featuredImage}
                className="article-main-img"
              />
            </div>
          )}

          <div className="article-left-sidebar">
            <div className="article-toc-block">
              <h3 className="article-toc-h3">Table of Contents</h3>
              <ol role="list" className="article-toc-list" />
            </div>
          </div>

          <div className="article-wrapper">
            <div
              className="article-content-area w-richtext"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
