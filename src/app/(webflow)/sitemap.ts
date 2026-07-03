import type { MetadataRoute } from 'next';
import { readdirSync } from 'fs';
import { join } from 'path';
import { getAllCitySlugs } from '@/lib/data/cities';
import { getAllServiceSlugs } from '@/lib/data/services';
import { getAllBlogSlugs } from '@/lib/data/blog';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.sosmovingla.net';
  const pagesDir = join(process.cwd(), 'public/pages');

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/about-us`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/services`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/blog`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/about-us/faq`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/about-us/contact-us`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/about-us/reviews`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/about-us/gallery`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/free-estimate`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/about-us/apartment-partnership`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/about-us/careers`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/about-us/company-policy`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/about-us/influencer-program`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/about-us/meet-our-team`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/about-us/referral`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/about-us/video-reviews`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/book-online`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/confirmation-page-refer-friends-get-cash`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/sitemap`, changeFrequency: 'monthly', priority: 0.3 },
  ];

  // City pages
  const cityPages: MetadataRoute.Sitemap = getAllCitySlugs().map((city) => ({
    url: city.parentSlug
      ? `${baseUrl}/${city.parentSlug}/${city.slug}`
      : `${baseUrl}/${city.slug}`,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  // Service pages
  const servicePages: MetadataRoute.Sitemap = getAllServiceSlugs().map((s) => ({
    url: `${baseUrl}/services/${s.slug}`,
    changeFrequency: 'monthly',
    priority: 0.9,
  }));

  // Blog posts — объединяем .md (с гейтом draft/publishAt) и HTML-only статьи
  const mdSlugs = new Set(getAllBlogSlugs());
  const htmlBlogSlugs = readdirSync(pagesDir)
    .filter((f) => f.startsWith('blog__') && f.endsWith('.html'))
    .map((f) => f.replace('blog__', '').replace('.html', ''));
  const allBlogSlugs = new Set<string>([...mdSlugs, ...htmlBlogSlugs]);

  const blogPages: MetadataRoute.Sitemap = [...allBlogSlugs].map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  // Career sub-pages (одна страница на каждую вакансию)
  const careerPages: MetadataRoute.Sitemap = readdirSync(pagesDir)
    .filter((f) => f.startsWith('careers__') && f.endsWith('.html'))
    .map((f) => ({
      url: `${baseUrl}/careers/${f.replace('careers__', '').replace('.html', '')}`,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }));

  // Category pages (11 категорий блога)
  const categoryPages: MetadataRoute.Sitemap = [
    'after-the-move', 'business-relocation', 'general', 'local-moving-tips',
    'long-distance', 'los-angeles', 'move-sustainably', 'moving-day-preparation',
    'moving-professionals', 'packing-tips', 'top-places-to-live',
  ].map((slug) => ({
    url: `${baseUrl}/category/${slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...cityPages, ...servicePages, ...blogPages, ...careerPages, ...categoryPages];
}
