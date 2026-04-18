import Link from "next/link";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { readPost } from "@/lib/admin/content-store";

export const dynamic = "force-dynamic";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = await readPost(slug);
  return {
    title: post ? `Preview · ${post.frontmatter.title}` : "Preview",
    robots: { index: false, follow: false },
  };
}

/**
 * Live article preview that renders a draft post inside the production
 * blog-post chrome (breadcrumbs → H1 → hero image → article body).
 *
 * Markdown is converted to HTML with `marked` and injected via
 * dangerouslySetInnerHTML into the `article-content-area w-richtext`
 * container — exactly the same wrapper the real blog posts use, so
 * Webflow's prose styles (.w-richtext h1/h2/a/etc) apply unchanged.
 *
 * Auth: proxy.ts gates /preview/* → sends anon to /admin/login.
 */
export default async function PreviewBlogPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = await readPost(slug);
  if (!post) notFound();

  const fm = post.frontmatter;
  const html = marked.parse(post.content, { async: false }) as string;

  return (
    <div className="services-hero-section is-blog-article-hero is-without-bg-image">
      <div className="container services-hero-container w-container">
        <div className="breadcrumbs">
          <Link href="/" className="breadcrumbs-link">
            Home
          </Link>
          <div className="text-size-14 weight-700 text-color">&gt;</div>
          <Link href="/blog" className="breadcrumbs-link">
            Blog
          </Link>
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
                alt={fm.title ?? ""}
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
