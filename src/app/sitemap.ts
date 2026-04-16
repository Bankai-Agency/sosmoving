import type { MetadataRoute } from 'next';
import { getAllCitySlugs } from '@/lib/data/cities';
import { getAllServiceSlugs } from '@/lib/data/services';
import { getAllBlogSlugs } from '@/lib/data/blog';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.sosmovingla.net';

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

  // Blog posts
  const blogPages: MetadataRoute.Sitemap = getAllBlogSlugs().map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticPages, ...cityPages, ...servicePages, ...blogPages];
}
