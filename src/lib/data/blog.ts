import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import type { BlogPost, BlogPostCard } from '@/lib/types';

const BLOG_DIR = join(process.cwd(), 'src/data/blog');

/**
 * A post is visible on the public site when it is NOT a draft. Scheduled
 * posts (draft=true AND publishAt is in the past) become visible too —
 * that's how the scheduled-publish cron works: it flips draft=false at the
 * scheduled time, but even without the cron run this filter catches it on
 * the next request.
 */
function isPublicPost(data: { draft?: boolean; publishAt?: string }, now: Date = new Date()): boolean {
  if (data.draft !== true) return true;
  if (data.publishAt && new Date(data.publishAt) <= now) return true;
  return false;
}

export function getBlogPost(slug: string): BlogPost | null {
  try {
    const file = readFileSync(join(BLOG_DIR, `${slug}.md`), 'utf-8');
    const { data, content } = matter(file);
    if (!isPublicPost(data)) return null;
    return { ...data, content, slug } as BlogPost;
  } catch {
    return null;
  }
}

export function getAllBlogSlugs(): string[] {
  try {
    const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'));
    const out: string[] = [];
    for (const f of files) {
      try {
        const { data } = matter(readFileSync(join(BLOG_DIR, f), 'utf-8'));
        if (isPublicPost(data)) out.push(f.replace('.md', ''));
      } catch {
        // unreadable — skip
      }
    }
    return out;
  } catch {
    return [];
  }
}

export function getBlogPosts({
  page = 1,
  limit = 12,
  category,
}: {
  page?: number;
  limit?: number;
  category?: string;
} = {}): { posts: BlogPostCard[]; total: number; totalPages: number } {
  const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'));
  const allCards: BlogPostCard[] = [];

  for (const file of files) {
    try {
      const raw = readFileSync(join(BLOG_DIR, file), 'utf-8');
      const { data, content } = matter(raw);

      if (!isPublicPost(data)) continue;
      // Posts carry multiple categories (Webflow parity); `category` alone
      // is the primary one shown on the card badge.
      const cats: string[] = data.categories ?? [data.category];
      if (category && !cats.includes(category)) continue;

      allCards.push({
        slug: file.replace('.md', ''),
        title: data.title || file,
        excerpt: content.substring(0, 200).replace(/[#*\[\]]/g, '').trim(),
        featuredImage: data.featuredImage || '',
        publishDate: data.publishDate || '',
        readTime: data.readTime || '',
        category: data.category || 'general',
      });
    } catch {}
  }

  // Sort by date (newest first)
  allCards.sort((a, b) => {
    const da = new Date(a.publishDate || 0).getTime();
    const db = new Date(b.publishDate || 0).getTime();
    return db - da;
  });

  const total = allCards.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const posts = allCards.slice(start, start + limit);

  return { posts, total, totalPages };
}

export function getPostsByCategory(category: string) {
  return getBlogPosts({ category, limit: 100 });
}
