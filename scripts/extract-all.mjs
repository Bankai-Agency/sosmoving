#!/usr/bin/env node
/**
 * Extract all data from legacy HTML files into JSON/Markdown.
 * Run: node scripts/extract-all.mjs
 */

import { load } from 'cheerio';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, cpSync, statSync } from 'fs';
import { join, basename, dirname } from 'path';

const LEGACY = './_legacy';
const DATA = './src/data';
const PUBLIC = './public/images';

// Ensure output dirs
for (const d of [
  `${DATA}/cities`, `${DATA}/services`, `${DATA}/blog`, `${DATA}/shared`,
  `${PUBLIC}/cities`, `${PUBLIC}/services`, `${PUBLIC}/blog`, `${PUBLIC}/team`, `${PUBLIC}/general`
]) {
  mkdirSync(d, { recursive: true });
}

// ============================================================
// HELPERS
// ============================================================

function readHTML(filepath) {
  try {
    return readFileSync(filepath, 'utf-8');
  } catch { return null; }
}

function cleanText(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function writeJSON(filepath, data) {
  writeFileSync(filepath, JSON.stringify(data, null, 2));
}

// Map legacy image paths to public paths
function mapImagePath(src, category) {
  if (!src) return '';
  // Extract just the filename from the path
  const parts = src.split('/');
  const filename = parts[parts.length - 1];
  if (!filename || filename.includes('..')) return '';
  return `/images/${category}/${filename}`;
}

// Copy an image from legacy assets to public
function copyImage(src, category) {
  if (!src) return '';

  // Find the actual file in legacy assets
  let sourcePath = '';
  if (src.startsWith('assets/')) {
    sourcePath = join(LEGACY, src);
  } else if (src.startsWith('/assets/') || src.startsWith('../assets/') || src.includes('assets/cdn/')) {
    // Normalize the path
    const normalized = src.replace(/^\.\.\/+/g, '').replace(/^\//, '');
    sourcePath = join(LEGACY, normalized);
  } else {
    return '';
  }

  const parts = src.split('/');
  const filename = parts[parts.length - 1];
  if (!filename) return '';

  const destPath = join(PUBLIC, category, decodeURIComponent(filename));

  try {
    if (existsSync(sourcePath) && !existsSync(destPath)) {
      cpSync(sourcePath, destPath);
    }
  } catch (e) {
    // skip errors
  }

  return `/images/${category}/${decodeURIComponent(filename)}`;
}

// ============================================================
// EXTRACT CITIES
// ============================================================

function extractCities() {
  console.log('\n=== Extracting Cities ===');

  const cityDirs = [];
  const topLevel = readdirSync(LEGACY);

  for (const dir of topLevel) {
    if (dir.endsWith('-movers') || dir.startsWith('movers-')) {
      const indexPath = join(LEGACY, dir, 'index.html');
      if (existsSync(indexPath)) {
        cityDirs.push({ slug: dir, path: indexPath, parent: null });
      }
      // Check for nested cities
      const subPath = join(LEGACY, dir);
      try {
        const subDirs = readdirSync(subPath);
        for (const sub of subDirs) {
          if (sub.endsWith('-movers') || sub.startsWith('movers-')) {
            const subIndex = join(subPath, sub, 'index.html');
            if (existsSync(subIndex)) {
              cityDirs.push({ slug: sub, path: subIndex, parent: dir });
            }
          }
        }
      } catch {}
    }
  }

  // Also check special city pages
  for (const special of ['la-movers', 'local-movers', 'moving-services']) {
    const p = join(LEGACY, special, 'index.html');
    if (existsSync(p) && !cityDirs.find(c => c.slug === special)) {
      cityDirs.push({ slug: special, path: p, parent: null });
    }
  }

  const registry = [];
  let count = 0;

  for (const city of cityDirs) {
    const html = readHTML(city.path);
    if (!html) continue;

    const $ = load(html);

    const title = $('title').text().trim();
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const heroH1 = cleanText($('.services-hero-h1').text());
    const heroSubtitle = cleanText($('.services-hero-subtitle, .services-hero-description, .section-subtitle').first().text());

    // Get hero image from background or img
    let heroImage = '';
    const heroSection = $('.services-hero-section, .hero-section').first();
    const heroBg = heroSection.find('[style*="background"]').attr('style') || '';
    const bgMatch = heroBg.match(/url\(['""]?([^'"")]+)/);
    if (bgMatch) {
      heroImage = copyImage(bgMatch[1], 'cities');
    } else {
      const heroImg = heroSection.find('img').first().attr('src');
      if (heroImg) heroImage = copyImage(heroImg, 'cities');
    }

    // Extract content sections
    const sections = [];
    $('.service-content-section, .service-content-section-2, .local-white-content').each((i, el) => {
      const sectionEl = $(el);
      const sTitle = cleanText(sectionEl.find('h2, h3').first().text());
      const sContent = cleanText(sectionEl.find('p, .service-content-text, .w-richtext').text());
      const sImg = sectionEl.find('img').first().attr('src');

      sections.push({
        type: 'content',
        title: sTitle,
        content: sContent.substring(0, 2000),
        image: sImg ? copyImage(sImg, 'cities') : '',
      });
    });

    // Extract FAQ
    const faq = [];
    $('.faq-question, .faq-dd-toggle').each((i, el) => {
      const question = cleanText($(el).text());
      const answer = cleanText($(el).next('.faq-dd-content, .faq-answer').text());
      if (question && answer) {
        faq.push({ question, answer: answer.substring(0, 1000) });
      }
    });

    // Determine section order from HTML
    const sectionOrder = [];
    $('section, [class*="-section"]').each((i, el) => {
      const cls = $(el).attr('class') || '';
      if (cls.includes('hero')) sectionOrder.push('services-hero');
      else if (cls.includes('service-content') || cls.includes('local-white')) sectionOrder.push('service-content');
      else if (cls.includes('services-section') && !cls.includes('hero')) sectionOrder.push('services-grid');
      else if (cls.includes('why-sos')) sectionOrder.push('why-sos');
      else if (cls.includes('section-reviews')) sectionOrder.push('reviews');
      else if (cls.includes('reviews-section')) sectionOrder.push('video-reviews');
      else if (cls.includes('faq')) sectionOrder.push('faq');
      else if (cls.includes('bottom-cta') || cls.includes('cta-section')) sectionOrder.push('cta');
      else if (cls.includes('locations')) sectionOrder.push('locations-slider');
    });

    const cityData = {
      slug: city.slug,
      parentSlug: city.parent,
      title,
      metaDescription: metaDesc,
      canonicalUrl: city.parent ? `/${city.parent}/${city.slug}` : `/${city.slug}`,
      heroTitle: heroH1 || title.split('|')[0].trim(),
      heroSubtitle,
      heroImage,
      phone: '(909) 443-0004',
      sections,
      sectionOrder: [...new Set(sectionOrder)],
      faq,
    };

    writeJSON(`${DATA}/cities/${city.slug}.json`, cityData);
    registry.push({ slug: city.slug, parentSlug: city.parent });
    count++;
  }

  writeJSON(`${DATA}/cities/_registry.json`, registry);
  console.log(`  Extracted ${count} cities`);
}

// ============================================================
// EXTRACT SERVICES
// ============================================================

function extractServices() {
  console.log('\n=== Extracting Services ===');

  const servicesDir = join(LEGACY, 'services');
  if (!existsSync(servicesDir)) { console.log('  No services dir'); return; }

  const serviceDirs = readdirSync(servicesDir).filter(d => {
    return existsSync(join(servicesDir, d, 'index.html'));
  });

  const registry = [];

  for (const slug of serviceDirs) {
    const html = readHTML(join(servicesDir, slug, 'index.html'));
    if (!html) continue;

    const $ = load(html);
    const title = $('title').text().trim();
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const heroH1 = cleanText($('.services-hero-h1, h1').first().text());
    const heroSubtitle = cleanText($('.services-hero-subtitle, .section-subtitle').first().text());

    // Hero image
    let heroImage = '';
    const heroImg = $('.services-hero-section img, .hero-section img').first().attr('src');
    if (heroImg) heroImage = copyImage(heroImg, 'services');

    // Service images
    const serviceImages = [];
    $('.services-item img, .service-content-image img').each((i, el) => {
      const src = $(el).attr('src');
      if (src) serviceImages.push(copyImage(src, 'services'));
    });

    // Sections content
    const sections = [];
    $('.service-content-section, .about-company-section, .advantages-content-section').each((i, el) => {
      const sTitle = cleanText($(el).find('h2, h3').first().text());
      const sContent = cleanText($(el).find('p, .w-richtext').text());
      const sImg = $(el).find('img').first().attr('src');
      sections.push({
        type: 'content',
        title: sTitle,
        content: sContent.substring(0, 2000),
        image: sImg ? copyImage(sImg, 'services') : '',
      });
    });

    // FAQ
    const faq = [];
    $('.faq-question, .faq-dd-toggle').each((i, el) => {
      const question = cleanText($(el).text());
      const answer = cleanText($(el).next('.faq-dd-content, .faq-answer').text());
      if (question && answer) faq.push({ question, answer: answer.substring(0, 1000) });
    });

    const serviceData = {
      slug,
      title,
      metaDescription: metaDesc,
      canonicalUrl: `/services/${slug}`,
      heroTitle: heroH1,
      heroSubtitle,
      heroImage,
      phone: '(909) 443-0004',
      sections,
      sectionOrder: ['services-hero', 'service-content', 'services-grid', 'why-sos', 'reviews', 'faq', 'cta'],
      faq,
    };

    writeJSON(`${DATA}/services/${slug}.json`, serviceData);
    registry.push({ slug, title: heroH1 || title });
  }

  writeJSON(`${DATA}/services/_registry.json`, registry);
  console.log(`  Extracted ${registry.length} services`);
}

// ============================================================
// EXTRACT BLOG POSTS
// ============================================================

function extractBlogPosts() {
  console.log('\n=== Extracting Blog Posts ===');

  const blogDir = join(LEGACY, 'blog');
  if (!existsSync(blogDir)) { console.log('  No blog dir'); return; }

  const postDirs = readdirSync(blogDir).filter(d => {
    const p = join(blogDir, d);
    return statSync(p).isDirectory() && existsSync(join(p, 'index.html'));
  });

  let count = 0;
  const categories = new Set();

  for (const slug of postDirs) {
    const html = readHTML(join(blogDir, slug, 'index.html'));
    if (!html) continue;

    const $ = load(html);

    const title = $('title').text().trim().split('|')[0].trim();
    const metaDesc = $('meta[name="description"]').attr('content') || '';

    // Featured image
    let featuredImage = '';
    const featImg = $('.article-image img, .services-hero-section img, .blog-article-image img').first().attr('src');
    if (featImg) featuredImage = copyImage(featImg, 'blog');

    // Date
    const dateText = cleanText($('.section-subtitle.is-blog-article, .blog-date, [class*="date"]').first().text());
    const dateMatch = dateText.match(/(\w+ \d+,?\s*\d{4})/);
    const publishDate = dateMatch ? dateMatch[1] : '';

    // Read time
    const readTimeEl = cleanText($('[class*="read-time"], .blog-read-time').text());
    const readTime = readTimeEl || '';

    // Category
    const categoryLink = $('.blog-category-link.w--current, .breadcrumbs-link').last().text().trim();
    const category = categoryLink || 'general';
    categories.add(category.toLowerCase());

    // Author
    const authorName = cleanText($('.article-author-name, .blog-author-name').first().text()) || 'SOS Moving';
    const authorRole = cleanText($('.article-author-title, .blog-author-role').first().text()) || '';
    const authorPhoto = '';

    // Article content - convert to markdown-like text
    const articleHtml = $('.article-content-area, .w-richtext').first().html() || '';

    // Simple HTML to Markdown conversion
    let content = articleHtml
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n')
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n')
      .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '\n##### $1\n')
      .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<em>(.*?)<\/em>/gi, '*$1*')
      .replace(/<a\s+href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1')
      .replace(/<ul[^>]*>/gi, '\n').replace(/<\/ul>/gi, '\n')
      .replace(/<ol[^>]*>/gi, '\n').replace(/<\/ol>/gi, '\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '\n$1\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)')
      .replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)')
      .replace(/<figure[^>]*>(.*?)<\/figure>/gis, '$1')
      .replace(/<figcaption[^>]*>(.*?)<\/figcaption>/gi, '*$1*')
      .replace(/<div[^>]*>/gi, '').replace(/<\/div>/gi, '')
      .replace(/<span[^>]*>/gi, '').replace(/<\/span>/gi, '')
      .replace(/<[^>]+>/g, '') // Remove remaining HTML tags
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Write as Markdown with frontmatter
    const md = `---
slug: "${slug}"
title: "${title.replace(/"/g, '\\"')}"
metaDescription: "${metaDesc.replace(/"/g, '\\"')}"
featuredImage: "${featuredImage}"
publishDate: "${publishDate}"
lastUpdated: "${publishDate}"
category: "${category.toLowerCase()}"
readTime: "${readTime}"
author:
  name: "${authorName}"
  role: "${authorRole}"
  photo: ""
---

${content}
`;

    writeFileSync(`${DATA}/blog/${slug}.md`, md);
    count++;

    if (count % 50 === 0) console.log(`  Progress: ${count}/${postDirs.length}`);
  }

  // Save categories
  writeJSON(`${DATA}/shared/categories.json`, [...categories].sort());
  console.log(`  Extracted ${count} blog posts, ${categories.size} categories`);
}

// ============================================================
// EXTRACT REVIEWS
// ============================================================

function extractReviews() {
  console.log('\n=== Extracting Reviews ===');

  const html = readHTML(join(LEGACY, 'index.html'));
  if (!html) { console.log('  No homepage'); return; }

  const $ = load(html);
  const reviews = [];

  $('.reviews-item, .review-card, [class*="review"]').each((i, el) => {
    const name = cleanText($(el).find('.reviews-name, .review-name, [class*="name"]').first().text());
    const text = cleanText($(el).find('.reviews-review-text, .review-text, [class*="text"]').first().text());
    if (name && text && text.length > 20) {
      reviews.push({
        name,
        text: text.substring(0, 500),
        rating: 5,
        platform: 'google',
      });
    }
  });

  // Extract from JSON-LD
  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const data = JSON.parse($(el).html());
      if (data.review && Array.isArray(data.review)) {
        for (const r of data.review) {
          if (!reviews.find(rv => rv.name === r.author?.name)) {
            reviews.push({
              name: r.author?.name || '',
              text: r.reviewBody || '',
              rating: Number(r.reviewRating?.ratingValue) || 5,
              platform: 'google',
            });
          }
        }
      }
    } catch {}
  });

  writeJSON(`${DATA}/shared/reviews.json`, reviews);
  console.log(`  Extracted ${reviews.length} reviews`);
}

// ============================================================
// EXTRACT FAQ
// ============================================================

function extractFAQ() {
  console.log('\n=== Extracting FAQ ===');

  // Extract from homepage
  const html = readHTML(join(LEGACY, 'index.html'));
  if (!html) return;

  const $ = load(html);
  const faq = [];

  $('.faq-dd-toggle, .faq-question').each((i, el) => {
    const question = cleanText($(el).text());
    const answerEl = $(el).next('.faq-dd-content, .faq-answer');
    const answer = cleanText(answerEl.text());
    if (question && answer) {
      faq.push({ question, answer });
    }
  });

  writeJSON(`${DATA}/shared/faq.json`, faq);
  console.log(`  Extracted ${faq.length} FAQ items`);
}

// ============================================================
// MIGRATE KEY IMAGES
// ============================================================

function migrateImages() {
  console.log('\n=== Migrating Images ===');

  const cdnDir = join(LEGACY, 'assets/cdn/645ab1d97922876b775bef4f');
  if (!existsSync(cdnDir)) { console.log('  No CDN dir'); return; }

  // Copy logo and key assets
  const keyFiles = [
    { pattern: 'Sos-logo', dest: 'general' },
    { pattern: 'logo-sos', dest: 'general' },
    { pattern: 'favicon', dest: 'general' },
    { pattern: 'apple-touch', dest: 'general' },
    { pattern: 'yelp', dest: 'general' },
    { pattern: 'google', dest: 'general' },
    { pattern: 'trustpilot', dest: 'general' },
    { pattern: 'bbb', dest: 'general' },
    { pattern: 'phone-icon', dest: 'general' },
    { pattern: 'free-quote', dest: 'general' },
    { pattern: 'star', dest: 'general' },
    { pattern: 'why-img', dest: 'general' },
    { pattern: 'company-img', dest: 'general' },
    { pattern: 'rate-img', dest: 'general' },
    { pattern: 'house', dest: 'general' },
    { pattern: 'chair', dest: 'general' },
    { pattern: 'gift', dest: 'general' },
    { pattern: 'services-img', dest: 'services' },
    { pattern: 'Apartment', dest: 'services' },
    { pattern: 'Commercial', dest: 'services' },
    { pattern: 'Long-Distance', dest: 'services' },
    { pattern: 'Packing', dest: 'services' },
    { pattern: 'White-Glove', dest: 'services' },
    { pattern: 'Storage', dest: 'services' },
    { pattern: 'Local-Moving', dest: 'services' },
    { pattern: 'locations-', dest: 'cities' },
    { pattern: 'la-img', dest: 'cities' },
    { pattern: 'portland', dest: 'cities' },
    { pattern: 'seattle', dest: 'cities' },
    { pattern: 'denver', dest: 'cities' },
    { pattern: 'orange-county', dest: 'cities' },
    { pattern: 'team', dest: 'team' },
    { pattern: 'gallery', dest: 'general' },
    { pattern: 'video-', dest: 'general' },
    { pattern: 'mobile-ab', dest: 'general' },
    { pattern: 'hero', dest: 'general' },
    { pattern: 'bg-poster', dest: 'general' },
  ];

  let copied = 0;

  function scanDir(dir) {
    try {
      const files = readdirSync(dir);
      for (const file of files) {
        const full = join(dir, file);
        try {
          if (statSync(full).isDirectory()) {
            scanDir(full);
            continue;
          }
        } catch { continue; }

        for (const key of keyFiles) {
          if (file.includes(key.pattern)) {
            const dest = join(PUBLIC, key.dest, file);
            if (!existsSync(dest)) {
              try {
                cpSync(full, dest);
                copied++;
              } catch {}
            }
            break;
          }
        }
      }
    } catch {}
  }

  scanDir(cdnDir);

  // Also copy CMS blog images
  const cmsDir = join(LEGACY, 'assets/cdn/645ab1d97922878b6f5bef7f');
  if (existsSync(cmsDir)) {
    try {
      const files = readdirSync(cmsDir);
      for (const file of files) {
        const src = join(cmsDir, file);
        const dest = join(PUBLIC, 'blog', file);
        if (!existsSync(dest) && !statSync(src).isDirectory()) {
          try { cpSync(src, dest); copied++; } catch {}
        }
      }
    } catch {}
  }

  console.log(`  Copied ${copied} images`);
}

// ============================================================
// EXTRACT NAVIGATION
// ============================================================

function extractNavigation() {
  console.log('\n=== Extracting Navigation ===');

  const html = readHTML(join(LEGACY, 'index.html'));
  if (!html) return;
  const $ = load(html);

  // Extract service area tabs from homepage
  const serviceAreas = {};
  $('.services-areas-tab, .tab-link').each((i, el) => {
    const region = cleanText($(el).text());
    if (region) serviceAreas[region] = [];
  });

  $('.services-areas-content .services-areas-link, .tab-pane a').each((i, el) => {
    const href = $(el).attr('href') || '';
    const label = cleanText($(el).text());
    // Just collect all city links
    if (href && label) {
      // Determine region from parent tab pane
    }
  });

  writeJSON(`${DATA}/shared/navigation.json`, {
    services: [
      { label: "All Services", href: "/services" },
      { label: "Apartment Movers", href: "/services/apartment-movers" },
      { label: "Commercial Movers", href: "/services/commercial-movers" },
      { label: "Long-Distance Movers", href: "/services/long-distance-movers" },
      { label: "Packing Services", href: "/services/packing-services" },
      { label: "White Glove Movers", href: "/services/white-glove-movers" },
      { label: "Storage", href: "/services/storage" },
      { label: "Local Movers", href: "/services/local-moving" },
    ],
    locations: [
      { label: "Los Angeles Movers", href: "/los-angeles-movers" },
      { label: "Orange County Movers", href: "/orange-county-movers" },
      { label: "Portland Movers", href: "/portland-movers" },
      { label: "Seattle Movers", href: "/seattle-movers" },
      { label: "Denver Movers", href: "/denver-movers" },
    ],
  });
  console.log('  Done');
}

// ============================================================
// RUN ALL
// ============================================================

console.log('Starting data extraction...');
const start = Date.now();

migrateImages();
extractCities();
extractServices();
extractReviews();
extractFAQ();
extractNavigation();
extractBlogPosts();

const elapsed = ((Date.now() - start) / 1000).toFixed(1);
console.log(`\n✅ Done in ${elapsed}s`);

// Print summary
const cityCount = readdirSync(`${DATA}/cities`).filter(f => f !== '_registry.json').length;
const serviceCount = readdirSync(`${DATA}/services`).filter(f => f !== '_registry.json').length;
const blogCount = readdirSync(`${DATA}/blog`).length;
console.log(`  Cities: ${cityCount}`);
console.log(`  Services: ${serviceCount}`);
console.log(`  Blog posts: ${blogCount}`);
