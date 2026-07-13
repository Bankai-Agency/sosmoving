import { notFound } from "next/navigation";
import { readPost } from "@/lib/admin/content-store";
import { MdArticle } from "@/components/blog/MdArticle";

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
 * Rendering is shared with the public md path — see MdArticle.
 *
 * Auth: proxy.ts gates /preview/* → sends anon to /admin/login.
 */
export default async function PreviewBlogPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = await readPost(slug);
  if (!post) notFound();

  return <MdArticle fm={post.frontmatter} content={post.content} />;
}
