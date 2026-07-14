#!/usr/bin/env node
/**
 * Removes internal links that point to deleted blog articles.
 *
 * md files in src/data/blog are the source of truth for a post's
 * existence (same rule as the /blog/[slug] route). A link to
 * /blog/<slug> whose md file is gone gets unwrapped — the anchor is
 * replaced by its plain text, page copy stays intact:
 *   <a href="/blog/dead">custom crating</a>  →  custom crating   (html)
 *   [custom crating](/blog/dead)             →  custom crating   (md)
 *
 * Scans: public/pages/*.html, src/data/shared/*.html, src/data/blog/*.md.
 * Links to DRAFT articles are kept (the article exists, it may come back).
 *
 * Usage:
 *   node scripts/fix-dead-blog-links.mjs --dry   # report only
 *   node scripts/fix-dead-blog-links.mjs         # rewrite files
 *
 * Run after deleting articles from the admin, then commit the changes.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const BLOG_DIR = join(ROOT, 'src/data/blog');
const HTML_DIRS = [join(ROOT, 'public/pages'), join(ROOT, 'src/data/shared')];
const DRY = process.argv.includes('--dry');

const alive = new Set(
  readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, '')),
);

const escapeHtml = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
let filesTouched = 0;
let removed = 0;
const deadSeen = new Map(); // slug -> count

function slugFromHref(href) {
  const m = href.match(/^\/blog\/([a-z0-9-]+)\/?$/);
  return m ? m[1] : null;
}

// 1. html sources: unwrap <a href="/blog/dead">text</a>
for (const dir of HTML_DIRS) {
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.html'))) {
    const fp = join(dir, file);
    let s = readFileSync(fp, 'utf8');
    const orig = s;
    s = s.replace(
      /<a\s+href="(\/blog\/[a-z0-9-]+\/?)"[^>]*>((?:(?!<\/?a[\s>]).)*?)<\/a>/gs,
      (whole, href, inner) => {
        const slug = slugFromHref(href);
        if (!slug || alive.has(slug)) return whole;
        deadSeen.set(slug, (deadSeen.get(slug) ?? 0) + 1);
        removed++;
        return inner;
      },
    );
    if (s !== orig) {
      filesTouched++;
      if (!DRY) writeFileSync(fp, s);
    }
  }
}

// 2. md sources: [text](/blog/dead) → text
for (const file of readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'))) {
  const fp = join(BLOG_DIR, file);
  let s = readFileSync(fp, 'utf8');
  const orig = s;
  s = s.replace(/\[([^\]]+)\]\((\/blog\/[a-z0-9-]+)\/?\)/g, (whole, text, href) => {
    const slug = slugFromHref(href);
    if (!slug || alive.has(slug)) return whole;
    deadSeen.set(slug, (deadSeen.get(slug) ?? 0) + 1);
    removed++;
    return text;
  });
  if (s !== orig) {
    filesTouched++;
    if (!DRY) writeFileSync(fp, s);
  }
}

console.log(`${DRY ? '[DRY RUN] ' : ''}dead targets: ${deadSeen.size}, links unwrapped: ${removed}, files ${DRY ? 'would change' : 'changed'}: ${filesTouched}`);
for (const [slug, n] of [...deadSeen].sort((a, b) => b[1] - a[1])) {
  console.log(`  /blog/${slug} — ${n} link(s)`);
}
if (!removed) console.log('  (битых ссылок на удалённые статьи нет)');
