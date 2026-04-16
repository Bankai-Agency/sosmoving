import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import type { BlogPost, BlogPostCard } from '@/lib/types';

const BLOG_DIR = join(process.cwd(), 'src/data/blog');

export function getBlogPost(slug: string): BlogPost | null {
  try {
    const file = readFileSync(join(BLOG_DIR, `${slug}.md`), 'utf-8');
    const { data, content } = matter(file);
    return { ...data, content, slug } as BlogPost;
  } catch {
    return null;
  }
}

export function getAllBlogSlugs(): string[] {
  try {
    return readdirSync(BLOG_DIR)
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace('.md', ''));
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
  const slugs = getAllBlogSlugs();
  const allCards: BlogPostCard[] = [];

  for (const slug of slugs) {
    try {
      const file = readFileSync(join(BLOG_DIR, `${slug}.md`), 'utf-8');
      const { data, content } = matter(file);

      if (category && data.category !== category) continue;

      allCards.push({
        slug,
        title: data.title || slug,
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
