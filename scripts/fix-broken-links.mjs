// Rewrites broken internal links in public/pages/*.html and
// src/data/shared/*.html using src/data/broken-links-map.csv (from the SEO
// migration fix brief) plus src/data/broken-links-map-extra.csv (mappings
// found by a follow-up full-link sweep: /resources/* → /blog/*, plus city
// links pointing at the wrong nesting in both directions).
// Rows with an empty correct_url ("unknown" kind) are skipped — those
// targets never existed on either site and need an editorial decision.
// Idempotent: run any number of times.
//
// Usage: node scripts/fix-broken-links.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const HTML_DIRS = [join(ROOT, 'public/pages'), join(ROOT, 'src/data/shared')];

const map = ['src/data/broken-links-map.csv', 'src/data/broken-links-map-extra.csv']
  .flatMap((f) =>
    readFileSync(join(ROOT, f), 'utf8')
      .replace(/^﻿/, '')
      .split(/\r?\n/)
      .slice(1)
      .filter(Boolean),
  )
  .map((line) => line.split(','))
  .filter(([wrong, correct]) => wrong && correct)
  .map(([wrong, correct]) => ({ wrong, correct }));

console.log(`mappings: ${map.length}`);

let filesTouched = 0;
let totalRewrites = 0;
const perMapping = new Map(map.map((m) => [m.wrong, 0]));

for (const fp of HTML_DIRS.flatMap((dir) =>
  readdirSync(dir)
    .filter((f) => f.endsWith('.html'))
    .map((f) => join(dir, f)),
)) {
  let html = readFileSync(fp, 'utf8');
  let changed = false;
  for (const { wrong, correct } of map) {
    // Exact href match (quote-bounded, optional trailing slash) so that
    // e.g. /calabasas-movers does not also rewrite /calabasas-movers-foo.
    const re = new RegExp(`href="${wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?"`, 'g');
    html = html.replace(re, () => {
      changed = true;
      totalRewrites++;
      perMapping.set(wrong, perMapping.get(wrong) + 1);
      return `href="${correct}"`;
    });
  }
  if (changed) {
    writeFileSync(fp, html);
    filesTouched++;
  }
}

const unused = [...perMapping].filter(([, n]) => n === 0).map(([w]) => w);
console.log(`files touched: ${filesTouched}, links rewritten: ${totalRewrites}`);
if (unused.length) console.log(`mappings with 0 hits (already fixed or not in HTML):\n  ${unused.join('\n  ')}`);
