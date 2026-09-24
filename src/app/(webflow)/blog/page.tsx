import * as cheerio from 'cheerio';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlogCard } from '@/components/blog/BlogCard';
import { Pagination, paginatedMetadata, resolvePage } from '@/components/blog/Pagination';
import { SectionRenderer } from '@/components/sections/registry';
import { getBlogPosts } from '@/lib/data/blog';
import { parsePageSections } from '@/lib/page-sections';
import { metaForPath } from '@/lib/seo-meta';

type Props = { searchParams: Promise<{ page?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { page } = await searchParams;
  return paginatedMetadata(metaForPath('/blog'), '/blog', page);
}

/**
 * The scraped page with the article list swapped for a server-rendered one:
 * the Webflow list showed 12 posts and a pager (?e0b30627_page=N) that Next
 * ignores, so the rest of the blog was unreachable from here. blog.html keeps
 * only the category list inside .blog-section; cards and pager come from the
 * markdown posts, as on /category/*.
 */
export default async function Page({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = resolvePage(pageParam, '/blog');
  const { posts, totalPages } = getBlogPosts({ page, limit: 12 });
  if (page > totalPages) notFound();

  const sections = parsePageSections('blog');
  const i = sections.findIndex((s) => s.type === 'blog-section');
  const categories = cheerio.load(sections[i].innerHtml, null, false)('.w-dyn-list').first().html() ?? '';

  return (
    <>
      <SectionRenderer sections={sections.slice(0, i)} />
      <div className={sections[i].className}>
        <div className="container w-container">
          <div className="w-dyn-list" dangerouslySetInnerHTML={{ __html: categories }} />
          <div className="blog-short-news-wrap w-dyn-list">
            <div role="list" className="blog-short-news-list w-dyn-items">
              {posts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} basePath="/blog" />
        </div>
      </div>
      <SectionRenderer sections={sections.slice(i + 1)} />
    </>
  );
}
