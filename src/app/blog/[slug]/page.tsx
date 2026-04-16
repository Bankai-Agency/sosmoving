import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getBlogPost, getAllBlogSlugs, getBlogPosts } from '@/lib/data/blog';
import { Container } from '@/components/ui/Container';
import { LatestNewsSection } from '@/components/sections/LatestNewsSection';
import { CtaSection } from '@/components/sections/CtaSection';

export async function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.metaDescription,
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      images: post.featuredImage ? [post.featuredImage] : [],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const { posts: relatedPosts } = getBlogPosts({
    category: post.category,
    limit: 4,
  });

  return (
    <>
      {/* Hero */}
      <section className="pt-[5rem] pb-6">
        <Container>
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-[0.6rem] text-text-muted mb-6">
            <Link href="/" className="hover:text-accent transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-accent transition-colors">
              Blog
            </Link>
            <span>/</span>
            <span className="text-accent">{post.title}</span>
          </nav>

          <h1 className="text-white text-[1.8rem] md:text-[2.4rem] font-black leading-tight mb-4">
            {post.title}
          </h1>

          <div className="flex items-center gap-4 text-[0.65rem] text-text-muted mb-6">
            {post.lastUpdated && (
              <span>Last updated: {post.lastUpdated}</span>
            )}
            {post.readTime && (
              <>
                <span>|</span>
                <span>{post.readTime}</span>
              </>
            )}
            {post.category && (
              <>
                <span>|</span>
                <Link
                  href={`/category/${post.category}`}
                  className="text-accent hover:underline capitalize"
                >
                  {post.category.replace(/-/g, ' ')}
                </Link>
              </>
            )}
          </div>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="relative aspect-[2/1] rounded-xl overflow-hidden mb-8">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 940px) 100vw, 940px"
              />
            </div>
          )}
        </Container>
      </section>

      {/* Article Content */}
      <section className="pb-16">
        <Container>
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Main content */}
            <article className="flex-1 prose max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {post.content}
              </ReactMarkdown>
            </article>
          </div>

          {/* Author */}
          {post.author && post.author.name && (
            <div className="mt-12 border-t border-white/10 pt-8 flex items-center gap-4">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                <span className="text-black font-bold">
                  {post.author.name.charAt(0)}
                </span>
              </div>
              <div>
                <div className="text-white font-bold text-[0.8rem]">
                  {post.author.name}
                </div>
                {post.author.role && (
                  <div className="text-[0.65rem] text-text-muted">
                    {post.author.role}
                  </div>
                )}
              </div>
            </div>
          )}
        </Container>
      </section>

      {/* Related Posts */}
      <LatestNewsSection posts={relatedPosts} />
      <CtaSection />
    </>
  );
}
