#!/usr/bin/env node
/**
 * One-shot sync of blog categories from the Webflow CMS export.
 *
 * Webflow posts carry MULTIPLE categories (semicolon-separated in the
 * export); the May scrape wrote only one per post, which left
 * /category/top-places-to-live empty and undersized most other listings.
 *
 * 1. Writes `categories: [...]` into the frontmatter of every md post
 *    found in the export (keeps the existing `category:` as the primary
 *    badge; adds it to the list if Webflow lacks it).
 * 2. Creates frontmatter-only md stubs for published Webflow posts that
 *    exist as scraped HTML but have no md file — without md they never
 *    appear in /category/* listings. Article pages still render the
 *    scraped HTML; the stub only feeds listings.
 *
 * Usage: node scripts/sync-blog-categories-from-export.mjs [path-to-csv]
 * Default CSV: _exports/SOS Moving - Blogs - 65a92d1fd36f5f043d607160.csv
 * (local-only, gitignored — the resulting md changes are what gets
 * committed).
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const BLOG_DIR = join(ROOT, 'src/data/blog');
const PAGES_DIR = join(ROOT, 'public/pages');
const CSV =
  process.argv[2] ??
  join(ROOT, '_exports/SOS Moving - Blogs - 65a92d1fd36f5f043d607160.csv');

// Minimal CSV parser (handles quoted fields with commas/newlines).
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift();
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

const posts = parseCsv(readFileSync(CSV, 'utf8').replace(/^﻿/, ''))
  .filter((r) => r.Archived === 'false' && r.Draft === 'false');
console.log(`export: ${posts.length} published posts`);

const yamlList = (arr) => `[${arr.map((c) => `"${c}"`).join(', ')}]`;

let updated = 0, stubs = 0, skipped = 0;
for (const p of posts) {
  const slug = p.Slug;
  const cats = (p.Categories || '')
    .split(';')
    .map((c) => c.trim())
    .filter(Boolean);
  const mdPath = join(BLOG_DIR, `${slug}.md`);

  if (existsSync(mdPath)) {
    let md = readFileSync(mdPath, 'utf8');
    const cur = md.match(/^category:\s*"?([a-z0-9-]+)"?\s*$/m);
    const primary = cur?.[1];
    const list = primary && !cats.includes(primary) ? [primary, ...cats] : cats;
    if (!list.length) { skipped++; continue; }
    md = md.replace(/^categories:.*\n/m, ''); // idempotent re-run
    if (cur) {
      md = md.replace(cur[0], `${cur[0]}\ncategories: ${yamlList(list)}`);
    } else {
      md = md.replace(/^---\n/, `---\ncategory: "${list[0]}"\ncategories: ${yamlList(list)}\n`);
    }
    writeFileSync(mdPath, md);
    updated++;
  } else if (existsSync(join(PAGES_DIR, `blog__${slug}.html`))) {
    // html-only post → stub so it shows up in category listings
    const primary = cats[0] || 'general';
    const date = p['Published On'] || p['Created On'];
    const stub = `---
slug: "${slug}"
title: ${JSON.stringify(p.Name)}
metaDescription: ${JSON.stringify(p['SEO Description'] || '')}
featuredImage: ${JSON.stringify(p['Thumbnail Image'] || p['Main image'] || '')}
publishDate: ${JSON.stringify(date)}
lastUpdated: ${JSON.stringify(p['Updated On'] || date)}
category: "${primary}"
categories: ${yamlList(cats.length ? cats : [primary])}
readTime: ${JSON.stringify(p['Reading time'] || '')}
author:
  name: ${JSON.stringify(p.Author || 'SOS Moving')}
  role: ""
  photo: ""
---

${(p.Excerpt || p['SEO Description'] || '').trim()}
`;
    writeFileSync(join(BLOG_DIR, `${slug}.md`), stub);
    stubs++;
  } else {
    skipped++;
  }
}
console.log(`md updated: ${updated}, stubs created: ${stubs}, skipped: ${skipped}`);
