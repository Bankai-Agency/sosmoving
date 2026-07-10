// Verifier for the SOS Moving migration fixes. No dependencies.
// Vendored from the fix-for-claude spec archive; data paths point at
// src/data/. NOTE: the broken-link section expects the WRONG urls to
// return 200 — ours 308-redirect to the correct pages, which is the
// intended end state; treat 308 rows there as pass.
// Usage:  node verify.mjs [baseUrl] [--all]
//   baseUrl default = https://sosmoving.vercel.app  (change to production once cut over)
//   without --all, checks a representative sample (fast). With --all, checks every URL.
import fs from 'node:fs';

const BASE = (process.argv[2] && process.argv[2].startsWith('http')) ? process.argv[2].replace(/\/$/, '') : 'https://sosmoving.vercel.app';
const ALL = process.argv.includes('--all');
const UA = 'Mozilla/5.0 SEO-Fix-Verifier';
const sot = JSON.parse(fs.readFileSync(new URL('../src/data/seo-meta.json', import.meta.url), 'utf8'));
const blmap = fs.readFileSync(new URL('../src/data/broken-links-map.csv', import.meta.url), 'utf8').split(/\r?\n/).slice(1).filter(Boolean)
  .map((l) => l.match(/(?:"[^"]*"|[^,])*/g)).map((m) => ({ wrong: (m[0] || '').replace(/^"|"$/g, ''), correct: (m[2] || '').replace(/^"|"$/g, '') }));

const SAMPLE = ['/', '/services/apartment-movers', '/services/commercial-movers', '/services/storage', '/los-angeles-movers', '/beverly-hills-movers', '/los-angeles-movers/santa-monica-movers', '/blog', '/blog/how-to-move-a-piano-up-stairs-safely-in-los-angeles', '/about-us'];
const pages = ALL ? sot : sot.filter((r) => SAMPLE.includes(r.url));

const dec = (s) => s.replace(/&amp;/g, '&').replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const pick = (html, re) => { const m = re.exec(html); return m ? dec(m[1]) : null; };

async function get(url) { try { const r = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'manual' }); return { status: r.status, html: await r.text() }; } catch (e) { return { status: 0, html: '' }; } }

const fail = { title: [], desc: [], canonical: [], og: [], jsonld: [], gtm: 0, statusBad: [] };
let ok = 0;
let idx = 0; const CONC = 10;
async function worker() {
  while (idx < pages.length) {
    const r = pages[idx++];
    const { status, html } = await get(BASE + r.url);
    if (status !== 200) { fail.statusBad.push(`${r.url} → ${status}`); continue; }
    const title = pick(html, /<title[^>]*>([^<]*)<\/title>/i);
    const desc = pick(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) || pick(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
    const canon = /<link[^>]+rel=["']canonical["']/i.test(html);
    const og = /property=["']og:title["']/i.test(html);
    const jsonld = (html.match(/application\/ld\+json/gi) || []).length;
    const gtm = /GTM-|googletagmanager/i.test(html);
    if (title !== dec(r.title)) fail.title.push(`${r.url}\n    exp: ${dec(r.title)}\n    got: ${title}`);
    if (r.description && desc !== dec(r.description)) fail.desc.push(r.url);
    if (!canon) fail.canonical.push(r.url);
    if (Object.keys(r.og || {}).length && !og) fail.og.push(r.url);
    if (r.jsonldExpected > 0 && jsonld === 0) fail.jsonld.push(r.url);
    if (!gtm) fail.gtm++;
    ok++;
  }
}
await Promise.all(Array.from({ length: CONC }, worker));

// broken links: sample check that wrong URLs are no longer linked / correct ones resolve
const brokenStillBad = [];
const toCheck = blmap.filter((b) => b.correct).slice(0, ALL ? blmap.length : 15);
let bi = 0;
async function bworker() { while (bi < toCheck.length) { const b = toCheck[bi++]; const s = (await get(BASE + b.wrong)).status; if (s === 200) { /* now resolves — could be fine if they made it valid */ } else brokenStillBad.push(`${b.wrong} → ${s} (should link to ${b.correct})`); } }
await Promise.all(Array.from({ length: 8 }, bworker));

const line = (n, arr) => `${arr.length === 0 ? 'PASS' : 'FAIL'}  ${n}: ${arr.length} проблем` + (arr.length ? '\n  - ' + arr.slice(0, 8).join('\n  - ') : '');
console.log(`\n=== VERIFY ${BASE}  (${pages.length} страниц, ${ALL ? 'ALL' : 'SAMPLE'}) ===\n`);
console.log(line('Title совпадает с эталоном', fail.title));
console.log(line('Description совпадает', fail.desc));
console.log(line('Canonical присутствует', fail.canonical));
console.log(line('Open Graph присутствует', fail.og));
console.log(line('JSON-LD присутствует (где ожидается)', fail.jsonld));
console.log(`${fail.gtm === 0 ? 'PASS' : 'FAIL'}  GTM/GA присутствует: отсутствует на ${fail.gtm} из ${ok} страниц`);
console.log(line('HTTP 200', fail.statusBad));
console.log(`\nБитые ссылки (flat/без /blog/) всё ещё 404: ${brokenStillBad.length}` + (brokenStillBad.length ? '\n  - ' + brokenStillBad.slice(0, 8).join('\n  - ') : ' — PASS'));
console.log(`\nИтог: ${ok} страниц проверено. Всё зелёное = метаданные восстановлены.`);
