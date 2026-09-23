#!/usr/bin/env node
// ТЗ 17 (tz/17-city-service-pages.md, «Внутренние ссылки»): every link between the new pages and
// the rest of the site, plus meta, noindex for unfinished pages, review cards and progress.
//
//   node sosmoving/scripts/tz17-links.mjs --wave N [--dry-run] [--max-reviews N]
//
// Deterministic and idempotent: blocks it owns sit between named tz17-links markers and are
// rebuilt whole on every run; single edits in other files check their own state first.
// Links go only to pages whose tz/17-results/<slug>.json says "done" (waves up to N).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = path.resolve(SITE, '..');
const PAGES_DIR = path.join(SITE, 'public/pages');

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry-run');
const argNum = (flag, def) => (argv.includes(flag) ? Number(argv[argv.indexOf(flag) + 1]) : def);
const wave = argNum('--wave', NaN);
const MAX_REVIEWS = argNum('--max-reviews', 6);
if (!Number.isInteger(wave) || wave < 1 || !Number.isInteger(MAX_REVIEWS) || MAX_REVIEWS < 0) {
  console.error('usage: node sosmoving/scripts/tz17-links.mjs --wave N [--dry-run] [--max-reviews N]');
  process.exit(1);
}

const TODO = 'TODO-TZ17';
const changes = [];
const warnings = [];
const errors = [];
const change = (msg) => { changes.push(msg); console.log(`  + ${msg}`); };
const warn = (msg) => { warnings.push(msg); console.log(`  ! ${msg}`); };
const rel = (f) => path.relative(ROOT, f).replace(/\\/g, '/');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => esc(s).replace(/"/g, '&quot;');

// ---------- files the script must never write ----------

const urlToFile = (u) => `${u.replace(/^\//, '').replace(/\//g, '__') || 'index'}.html`;
const PPC_URLS = fs.readFileSync(path.join(ROOT, 'tz/ppc-urls.txt'), 'utf8').split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
const PROTECTED = new Set([
  ...PPC_URLS.map((u) => path.join(PAGES_DIR, urlToFile(u))),
  path.join(SITE, 'src/data/shared/navigation.json'),
  path.join(SITE, 'src/data/shared/footer.html'),
  path.join(SITE, 'src/data/shared/footer-areas.html'),
].map((f) => path.resolve(f).toLowerCase()));
const isProtected = (f) => PROTECTED.has(path.resolve(f).toLowerCase());

// ---------- JSON with the file's own formatting ----------

function detectFmt(raw) {
  const bom = raw.startsWith('﻿');
  const body = bom ? raw.slice(1) : raw;
  const eol = body.includes('\r\n') ? '\r\n' : '\n';
  const compact = !/[\r\n]/.test(body.trimEnd());
  const m = body.match(/\n([ \t]+)\S/);
  return { bom, eol, indent: compact ? 0 : (m ? m[1] : '  '), trailing: /\n$/.test(body) };
}

function serialize(data, fmt) {
  let s = JSON.stringify(data, null, fmt.indent || undefined);
  if (fmt.eol === '\r\n') s = s.replace(/\n/g, '\r\n');
  if (fmt.trailing) s += fmt.eol;
  return (fmt.bom ? '﻿' : '') + s;
}

const jsonStore = new Map();
function loadJson(file) {
  if (jsonStore.has(file)) return jsonStore.get(file);
  const raw = fs.readFileSync(file, 'utf8');
  const fmt = detectFmt(raw);
  const data = JSON.parse(fmt.bom ? raw.slice(1) : raw);
  if (serialize(data, fmt) !== raw) throw new Error(`${rel(file)}: parse + serialize does not round-trip`);
  const entry = { data, fmt, raw };
  jsonStore.set(file, entry);
  return entry;
}
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));

// Text files: edits accumulate in memory, one change line per edit, written at the end.
const textStore = new Map();
function text(file) {
  if (!textStore.has(file)) {
    const raw = fs.readFileSync(file, 'utf8');
    textStore.set(file, { raw, cur: raw });
  }
  return textStore.get(file).cur;
}
function setText(file, next, what) {
  const e = textStore.get(file) || (text(file), textStore.get(file));
  if (e.cur === next) return false;
  if (isProtected(file)) throw new Error(`refusing to edit protected file ${rel(file)} (${what})`);
  e.cur = next;
  change(`${rel(file)}: ${what}`);
  return true;
}

// ---------- HTML helpers (same scanner as tz17-scaffold.mjs) ----------

const TAG_RE = /<!--[\s\S]*?-->|<(script|style)\b(?:[^>"']|"[^"]*"|'[^']*')*>[\s\S]*?<\/\1\s*>|<(\/?)([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
function* tags(html, from = 0) {
  const re = new RegExp(TAG_RE.source, 'g');
  re.lastIndex = from;
  let m;
  while ((m = re.exec(html))) {
    if (!m[3]) continue;
    yield { start: m.index, end: re.lastIndex, close: m[2] === '/', name: m[3].toLowerCase(), attrs: m[4] || '' };
  }
}
function element(html, start) {
  let depth = 0;
  let openEnd = -1;
  let name = null;
  for (const t of tags(html, start)) {
    if (name === null) { name = t.name; openEnd = t.end; }
    if (t.name !== name) continue;
    if (t.close) depth--;
    else if (!/\/\s*$/.test(t.attrs)) depth++;
    if (depth === 0) return { start, openEnd, closeStart: t.start, end: t.end, name };
  }
  throw new Error(`unclosed <${name}> at ${start}`);
}
const classTokens = (attrs) => ((attrs.match(/\bclass\s*=\s*"([^"]*)"/) || [])[1] || '').trim().split(/\s+/);
function findAll(html, pred) {
  const out = [];
  for (const t of tags(html)) if (!t.close && pred(classTokens(t.attrs), t)) out.push(element(html, t.start));
  return out;
}
const firstElement = (html) => { const t = tags(html).next().value; return t ? element(html, t.start) : null; };

const MARK = (kind, name) => `<!-- tz17-links:${kind}:${name} -->`;
function markerSpan(html, name) {
  const a = html.indexOf(MARK('start', name));
  if (a < 0) return null;
  const s = a + MARK('start', name).length;
  const e = html.indexOf(MARK('end', name), s);
  if (e < 0) throw new Error(`marker ${name}: start without end`);
  if (html.indexOf(MARK('start', name), s) >= 0) throw new Error(`marker ${name}: more than one pair`);
  return { s, e, inner: html.slice(s, e) };
}
const replaceSpan = (html, sp, content) => html.slice(0, sp.s) + content + html.slice(sp.e);
const wrapMarkers = (name, content) => MARK('start', name) + content + MARK('end', name);

// Position is in running text: not inside a tag and not inside an existing link.
function inPlainText(html, pos) {
  if (html.lastIndexOf('>', pos) < html.lastIndexOf('<', pos)) return false;
  const openA = html.lastIndexOf('<a ', pos);
  return openA < 0 || html.lastIndexOf('</a>', pos) > openA;
}

// ---------- inputs ----------

const pagesAll = readJson(path.join(ROOT, 'tz/17-pages.json')).pages;
const wavePages = pagesAll.filter((p) => p.wave === wave).sort((a, b) => a.n - b.n);
if (!wavePages.length) { console.error(`no pages in wave ${wave}`); process.exit(1); }
const live = pagesAll.filter((p) => p.wave <= wave);
const byUrl = new Map(pagesAll.map((p) => [p.url, p]));

const result = new Map();
for (const p of live) {
  const f = path.join(ROOT, 'tz/17-results', `${p.slug}.json`);
  if (fs.existsSync(f)) result.set(p.slug, readJson(f));
}
const statusOf = (p) => (result.get(p.slug) || {}).status || null;
const isDone = (p) => !!p && p.wave <= wave && statusOf(p) === 'done';
const isHeld = (p) => ['blocked', 'needs-review'].includes(statusOf(p));
const doneUrl = (u) => isDone(byUrl.get(u));

console.log(`ТЗ 17 · ссылки · волна ${wave} · ${wavePages.length} страниц · отзывов на страницу ≤ ${MAX_REVIEWS}${DRY ? ' · DRY RUN' : ''}`);
const counts = {};
for (const p of wavePages) counts[statusOf(p) || 'нет результата'] = (counts[statusOf(p) || 'нет результата'] || 0) + 1;
console.log(`  статусы: ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(', ')}`);
for (const p of wavePages) if (!result.has(p.slug)) warn(`${p.slug}: no tz/17-results file — page is not linked`);

const SERVICE = {
  'long-distance': { url: '/services/long-distance-movers', file: 'services__long-distance-movers', label: 'Long-Distance Movers' },
  commercial: { url: '/services/commercial-movers', file: 'services__commercial-movers', label: 'Commercial Movers' },
  packing: { url: '/services/packing-services', file: 'services__packing-services', label: 'Packing Services' },
  storage: { url: '/services/storage', file: 'services__storage', label: 'Moving & Storage' },
  apartment: { url: '/services/apartment-movers', file: 'services__apartment-movers', label: 'Apartment Movers' },
  'white-glove': { url: '/services/white-glove-movers', file: 'services__white-glove-movers', label: 'White Glove Movers' },
  piano: { url: '/services/piano-movers', file: 'services__piano-movers', label: 'Piano Movers' },
};
const PAGE0 = pagesAll.find((p) => p.n === 0);
const page0Done = isDone(PAGE0);
const isCityService = (p) => !p.url.startsWith('/services/');

// Place names and counties of city pages: footer city block (ТЗ 16) plus the geos of this ТЗ.
const footer = fs.readFileSync(path.join(SITE, 'src/data/shared/footer-areas.html'), 'utf8');
const placeName = new Map();
const footerCounty = { 'Los Angeles County': [], 'Orange County': [] };
for (const g of footer.split('footer-areas-group').slice(1)) {
  const title = ((g.match(/footer-areas-title">([^<]*)</) || [])[1] || '').trim();
  for (const m of g.matchAll(/href="([^"]*)" class="footer-link">([^<]*)</g)) {
    placeName.set(m[1], m[2].replace(/&amp;/g, '&'));
    if (title in footerCounty) footerCounty[title].push(m[1]);
  }
}
for (const p of pagesAll) placeName.set(p.city_page, p.geo);

const geoDemand = new Map();
for (const p of pagesAll) geoDemand.set(p.geo_key, (geoDemand.get(p.geo_key) || 0) + p.demand);
const geoCity = new Map(pagesAll.map((p) => [p.geo_key, { url: p.city_page, county: p.county, name: p.geo }]));

const heroCache = new Map();
function heroOf(cityUrl) {
  if (!heroCache.has(cityUrl)) heroCache.set(cityUrl, heroLookup(cityUrl));
  return heroCache.get(cityUrl);
}
function heroLookup(cityUrl) {
  const f = path.join(SITE, 'src/data/cities', `${cityUrl.split('/').pop()}.json`);
  if (!fs.existsSync(f)) return null;
  const img = readJson(f).heroImage;
  if (!img) return null;
  // Some city heroes point to /images/cities/ while the file sits in /images/general/.
  const found = [img, img.replace('/images/cities/', '/images/general/')]
    .map((u) => decodeURI(u)).find((u) => fs.existsSync(path.join(SITE, 'public', u)));
  if (!found) { warn(`${rel(f)}: heroImage ${img} not found in public/`); return null; }
  return encodeURI(found);
}

// ---------- A1. slider «<Service> Across <County>» ----------

function sliderSlides(html, file) {
  const sp = markerSpan(html, 'slider');
  if (!sp) return null;
  const first = firstElement(sp.inner);
  if (!first) throw new Error(`${file}: empty slider block, no card to model on`);
  return { sp, tpl: sp.inner.slice(first.start, first.end), count: (sp.inner.match(/class="locations-slide(?:-\d+)? slide"/g) || []).length };
}

function slideCard(tpl, { href, img, name }) {
  let out = tpl.replace(/(<a\b[^>]*?\bhref=")[^"]*(")/, (_, a, b) => a + escAttr(href) + b);
  out = out.replace(/<img\b[^>]*>/, (tag) => {
    let t = tag.replace(/\s(?:srcset|sizes)="[^"]*"/g, '').replace(/\bsrc="[^"]*"/, () => `src="${img}"`);
    t = /\balt="/.test(t) ? t.replace(/\balt="[^"]*"/, () => `alt="${escAttr(name)}"`) : t.replace(/<img\b/, () => `<img alt="${escAttr(name)}"`);
    return t;
  });
  return out.replace(/(<h3\b[^>]*>)[\s\S]*?(<\/h3>)/, (_, a, b) => a + esc(name) + b);
}

const templateCardCount = new Map();
function templateCount(tplFile) {
  if (!templateCardCount.has(tplFile)) {
    const html = fs.readFileSync(path.join(SITE, tplFile), 'utf8');
    const slider = findAll(html, (c) => /^locations-slider(-\d+)?$/.test(c[0]) && c.includes('slider'))[0];
    templateCardCount.set(tplFile, slider ? (html.slice(slider.openEnd, slider.closeStart).match(/class="locations-slide(?:-\d+)? slide"/g) || []).length : 0);
  }
  return templateCardCount.get(tplFile);
}

// City pages to top up a county: geos of same_service_same_county without a done page, then the
// other geos of this ТЗ in that county by demand, then the footer list of the county.
function topUpCities(p, exclude) {
  const out = [];
  const add = (u) => { if (u && !exclude.has(u) && !out.includes(u)) out.push(u); };
  for (const u of p.same_service_same_county || []) {
    const q = byUrl.get(u);
    if (q && !isDone(q)) add(q.city_page);
  }
  [...geoCity.entries()].filter(([, g]) => g.county === p.county)
    .sort((a, b) => geoDemand.get(b[0]) - geoDemand.get(a[0]) || a[0].localeCompare(b[0]))
    .forEach(([, g]) => add(g.url));
  for (const u of footerCounty[p.county] || []) add(u);
  return out;
}

function sliderCards(p, count) {
  const cards = [];
  const used = new Set([p.url, p.city_page]);
  const push = (href, cityUrl, name) => {
    if (cards.length >= count || used.has(href)) return;
    const img = heroOf(cityUrl);
    if (!img) { warn(`${p.slug}: no heroImage for ${cityUrl}, card ${href} skipped`); return; }
    used.add(href);
    used.add(cityUrl);
    cards.push({ href, img, name });
  };
  if (p === PAGE0) {
    // Table «1. Страницы услуг — родители»: Los Angeles, then the done piano pages with top demand.
    used.delete('/la-movers');
    push('/la-movers', '/la-movers', 'Los Angeles');
    live.filter((q) => q.service === 'piano' && q !== PAGE0 && isDone(q))
      .sort((a, b) => b.demand - a.demand || a.n - b.n)
      .forEach((q) => push(q.url, q.city_page, q.geo));
  } else {
    for (const u of p.same_service_same_county || []) {
      const q = byUrl.get(u);
      if (isDone(q)) push(q.url, q.city_page, q.geo);
    }
  }
  for (const u of topUpCities(p, used)) push(u, u, placeName.get(u) || u);
  if (cards.length < count) warn(`${p.slug}: slider has ${cards.length} of ${count} cards`);
  return cards;
}

// ---------- A2. review cards (ТЗ 15 markup) ----------

const pool = new Map(readJson(path.join(ROOT, 'reviews/pool.json')).map((r) => [r.rid, r]));
const byPageReviews = readJson(path.join(ROOT, 'reviews/by-page-tz17.json'));
const PLATFORM = {
  yelp: 'https://www.yelp.com/biz/sos-moving-los-angeles-4',
  google: 'https://www.google.com/maps/place/SOS+Moving/@34.001102,-118.160027,17z/data=!4m8!3m7!1s0x80c2c73054a25063:0xd9931e90628a9b15!8m2!3d34.001102!4d-118.160027!9m1!1b1!16s%2Fg%2F11j8_ff8nd',
};
const AVATAR_PLACEHOLDER = '/images/general/68b874c78fd1088d88247bce_la-img.avif';
// Platform logos come from the site-wide review cards (the common block).
const LOGO = {};
{
  const common = fs.readFileSync(path.join(PAGES_DIR, 'about-us__careers.html'), 'utf8');
  for (const src of ['google', 'yelp']) {
    const a = common.match(new RegExp(`<a\\b[^>]*class="social-media ${src}\\b[^"]*"[^>]*>([\\s\\S]*?)</a>`));
    const svg = a && a[1].match(/<svg[\s\S]*?<\/svg>/);
    if (svg) LOGO[src] = svg[0];
  }
}
const avatarCopies = [];

// Captions come from the platforms as typed: all caps ("PORTER RANCH, CA") or a bare state
// twice ("CA, CA"). The first is shown in title case, the second not at all.
function cityLabel(c) {
  const s = (c || '').trim();
  const m = s.match(/^(.*), ([A-Z]{2})$/);
  if (!m) return s;
  let city = m[1];
  if (/^[A-Z]{2}$/.test(city) || /\s[A-Z]{2}$/.test(city)) return '';
  if (city === city.toUpperCase()) city = city.toLowerCase().replace(/\b[a-z]/g, (ch) => ch.toUpperCase());
  return `${city}, ${m[2]}`;
}

function reviewCard(tpl, r) {
  const avatarFile = path.join(ROOT, 'reviews/avatars', `${r.rid}.jpg`);
  const hasAvatar = !r.defaultAvatar && fs.existsSync(avatarFile);
  if (hasAvatar) {
    const dest = path.join(SITE, 'public/images/reviews', `${r.rid}.jpg`);
    if (!fs.existsSync(dest) && !avatarCopies.some((c) => c.dest === dest)) avatarCopies.push({ from: avatarFile, dest });
  }
  const photo = hasAvatar ? `/images/reviews/${r.rid}.jpg` : AVATAR_PLACEHOLDER;
  if (!LOGO[r.src]) throw new Error(`no ${r.src} logo in the common review block`);
  let out = tpl.replace(/<img\b[^>]*class="reviews-author-photo"[^>]*>/, (tag) => tag
    .replace(/\bsrc="[^"]*"/, () => `src="${photo}"`).replace(/\balt="[^"]*"/, () => `alt="${escAttr(r.name)}"`));
  out = out.replace(/(<div class="reviews-author-name[^"]*">)[\s\S]*?(<\/div>)(<div\b[^>]*>)[^<]*(<\/div>)/,
    (_, a, b, c, d) => `${a}${esc(r.name)}<br>${b}${c}${esc(cityLabel(r.authorCity))}${d}`);
  out = out.replace(/<a\b([^>]*?)class="social-media (?:google|yelp)\b([^"]*)"([^>]*)>([\s\S]*?)<\/a>/, (_, pre, cls, post, inner) => {
    const attrs = `${pre}class="social-media ${r.src}${cls}"${post}`.replace(/\bhref="[^"]*"/, () => `href="${PLATFORM[r.src]}"`);
    const body = inner.replace(/<svg[\s\S]*?<\/svg>/, () => LOGO[r.src]).replace(/(<div class="links-hidden-txt">)[^<]*(<\/div>)/, (_, x, y) => x + r.src + y);
    return `<a${attrs}>${body}</a>`;
  });
  const quote = `"${esc(r.text.trim()).replace(/\r?\n/g, '<br>')}"`;
  return out.replace(/(<div class="reviews-review-text[^"]*">)[\s\S]*?(<\/div>)/, (_, a, b) => a + quote + b);
}

// ---------- A3. «Other Moving Services in <Geo>» ----------

function otherServices(p, html, sp) {
  const links = [];
  if (p.siblings_same_geo.length) {
    for (const u of p.siblings_same_geo) {
      const q = byUrl.get(u);
      if (isDone(q)) links.push([u, SERVICE[q.service].label]);
    }
  }
  links.push([p.city_page, `${p.geo} Movers`]);
  if (!p.siblings_same_geo.length) {
    // One page in the geo: the city page and the parent service page (page 0: the services hub).
    links.push(p.parent_service ? [p.parent_service, SERVICE[p.service].label] : ['/services', 'All Moving Services']);
  }
  const before = html.slice(0, sp.s);
  const h2 = [...before.matchAll(/<h2 class="([^"]*)"/g)].pop();
  const h2cls = h2 ? h2[1].split(/\s+/).filter((c) => c !== 'is-with-subtitle').join(' ') : 'section-h2 is-dark';
  const items = links.map(([u, t]) => `<li class="sitemap-list-item"><a href="${u}" class="sitemap-link is-inner-link" style="color:var(--black);display:inline-block;padding:6px 0">${esc(t)}</a></li>`).join('');
  return `<div class="tz17-other-services" style="margin-top:3rem"><h2 class="${h2cls}">Other Moving Services in ${esc(p.geo)}</h2><ul role="list" class="sitemap-list" style="padding-top:0">${items}</ul></div>`;
}

// ---------- A. new pages ----------

// Every page of waves up to N, not just this wave: same_service_same_county of a wave 1 page
// lists wave 2 pages, so the slider of a finished page has to pick up the new neighbours once
// they are done. Blocks are regenerated from scratch, so this stays idempotent.
console.log('\nA. новые страницы');
for (const p of live) {
  const file = path.join(PAGES_DIR, `${p.slug}.html`);
  if (!fs.existsSync(file)) { warn(`${rel(file)} missing`); continue; }
  let html = text(file);
  const done = isDone(p);

  const sl = sliderSlides(html, rel(file));
  if (!sl) warn(`${p.slug}: no slider markers`);
  else if (done) {
    const cards = sliderCards(p, templateCount(p.template) || sl.count);
    html = replaceSpan(html, sl.sp, cards.map((c) => slideCard(sl.tpl, c)).join(''));
  }

  const rsp = markerSpan(html, 'reviews');
  if (!rsp) warn(`${p.slug}: no reviews markers`);
  else if (done) {
    const picks = byPageReviews[p.slug];
    if (!picks) throw new Error(`reviews/by-page-tz17.json has no ${p.slug}`);
    const first = firstElement(rsp.inner);
    const tpl = rsp.inner.slice(first.start, first.end);
    const slides = picks.slice(0, MAX_REVIEWS).map(({ rid }) => {
      const r = pool.get(rid);
      if (!r) throw new Error(`${p.slug}: ${rid} not in reviews/pool.json`);
      return reviewCard(tpl, r);
    });
    html = replaceSpan(html, rsp, slides.join(''));
  }

  const osp = markerSpan(html, 'other-services');
  if (!osp) warn(`${p.slug}: no other-services markers`);
  else if (done) html = replaceSpan(html, osp, otherServices(p, html, osp));

  setText(file, html, 'slider, reviews, other services');
}

// ---------- B. seo-meta descriptions / C. noindex and registry ----------

console.log('\nB/C. seo-meta, registry');
const seoMeta = loadJson(path.join(SITE, 'src/data/seo-meta.json'));
const cityReg = loadJson(path.join(SITE, 'src/data/cities/_registry.json'));
const svcReg = loadJson(path.join(SITE, 'src/data/services/_registry.json'));
const metaByUrl = new Map(seoMeta.data.map((r) => [r.url, r]));
const NOINDEX = 'noindex, follow';

// All finished pages of waves up to N: a description edited in an earlier wave's result file
// reaches seo-meta on the next run too.
for (const p of live) {
  const rec = metaByUrl.get(p.url);
  if (!rec) { errors.push(`seo-meta.json has no record for ${p.url}`); continue; }
  const res = result.get(p.slug);
  const d = res && typeof res.description === 'string' ? res.description.trim() : '';
  const okLen = d.length >= 140 && d.length <= 160;
  if (isDone(p) && !d) errors.push(`${p.slug}: done without a description`);
  else if (isDone(p) && !okLen) errors.push(`${p.slug}: description is ${d.length} characters, need 140–160`);
  else if (d && !okLen) warn(`${p.slug}: description is ${d.length} characters — not set`);
  if (d && okLen) {
    const set = (obj, key, what) => { if (obj && obj[key] !== d) { obj[key] = d; change(`seo-meta ${p.url}: ${what}`); } };
    set(rec, 'description', 'description');
    set(rec.og, 'og:description', 'og:description');
    set(rec.twitter, 'twitter:description', 'twitter:description');
  }
  const robots = isHeld(p) ? NOINDEX : (rec.robots === NOINDEX ? '' : rec.robots);
  if (rec.robots !== robots) { rec.robots = robots; change(`seo-meta ${p.url}: robots "${robots}"`); }

  const svc = !isCityService(p);
  const reg = svc ? svcReg : cityReg;
  const key = svc ? p.url.replace('/services/', '') : p.slug;
  const i = reg.data.findIndex((r) => r.slug === key);
  if (isHeld(p) && i >= 0) { reg.data.splice(i, 1); change(`${svc ? 'services' : 'cities'}/_registry.json: − ${key}`); }
  if (isDone(p) && i < 0) {
    if (svc) {
      const j = reg.data.findIndex((r) => r.slug > key);
      reg.data.splice(j < 0 ? reg.data.length : j, 0, { slug: key, title: p.h1 });
    } else reg.data.push({ slug: key, parentSlug: null });
    change(`${svc ? 'services' : 'cities'}/_registry.json: + ${key}`);
  }
}

// ---------- D. service pages ----------

console.log('\nD. страницы услуг');
function byCityBlock(service) {
  const groups = ['Los Angeles County', 'Orange County'].map((county) => {
    const items = live.filter((q) => q.service === service && isCityService(q) && q.county === county && isDone(q))
      .sort((a, b) => a.geo.localeCompare(b.geo));
    if (!items.length) return '';
    const links = items.map((q) => `<a href="${q.url}" class="footer-link" style="color:var(--black)">${esc(q.geo)}</a>`).join('');
    return `<div class="footer-areas-group"><div class="footer-areas-title" style="color:var(--black);opacity:.6">${county}</div><div class="footer-areas-links">${links}</div></div>`;
  }).join('');
  if (!groups) return '';
  return `<div class="footer-areas" style="padding-bottom:0;border-bottom:0"><h3 class="footer-h4" style="color:var(--black);font-weight:600">${esc(SERVICE[service].label)} by City</h3>${groups}</div>`;
}

function putByCity(html, file, service) {
  const content = byCityBlock(service);
  const sp = markerSpan(html, 'by-city');
  if (sp) return replaceSpan(html, sp, content);
  const slider = findAll(html, (c) => /^locations-slider(-\d+)?$/.test(c[0]) && c.includes('slider'))[0];
  if (!slider) throw new Error(`${rel(file)}: no locations slider for the by-city block`);
  let pos = html.indexOf('</div>', slider.end);
  // slider → its wrapper div → the dots right after the wrapper (if present)
  const wrapperEnd = pos + '</div>'.length;
  const dots = html.slice(wrapperEnd).match(/^<div class="reviews-slider-dots slider-dots is-locations-slider-dots"><\/div>/);
  pos = dots ? wrapperEnd + dots[0].length : wrapperEnd;
  return html.slice(0, pos) + wrapMarkers('by-city', content) + html.slice(pos);
}

for (const [service, s] of Object.entries(SERVICE)) {
  const file = path.join(PAGES_DIR, `${s.file}.html`);
  if (service === 'piano') {
    if (!page0Done) continue;
  }
  let html = text(file);
  if (service !== 'piano') {
    // «… Near You» cards: Orange County → OC × service page when done; Calabasas «#» → city page.
    const slider = findAll(html, (c) => /^locations-slider(-\d+)?$/.test(c[0]) && c.includes('slider'))[0];
    if (!slider) throw new Error(`${rel(file)}: no locations slider`);
    const oc = live.find((q) => q.service === service && q.geo_key === 'orange county');
    const ocTarget = oc && isDone(oc) ? oc.url : '/orange-county-movers';
    const inner = html.slice(slider.openEnd, slider.closeStart).replace(
      /(<a href=")([^"]*)(" class="locations-slide-item(?:-\d+)?[^"]*"[^>]*>)([\s\S]*?<h3 class="locations-h3">)([^<]*)(<\/h3>)/g,
      (m, a, href, b, mid, h3, c) => {
        let to = href;
        if (h3.trim() === 'Orange County') to = ocTarget;
        if (h3.trim() === 'Calabasas' && href === '#') to = '/los-angeles-movers/calabasas-movers';
        return a + to + b + mid + h3 + c;
      });
    html = html.slice(0, slider.openEnd) + inner + html.slice(slider.closeStart);
  }
  html = putByCity(html, file, service);
  setText(file, html, `slider cards, «${s.label} by City»`);
}

// Contextual links to page 0.
{
  const local = path.join(PAGES_DIR, 'services__local-moving.html');
  let html = text(local);
  const plain = '<div class="pricing-body-text uppercase">Piano moving</div>';
  const linked = '<div class="pricing-body-text uppercase"><a href="/services/piano-movers" style="color:inherit;text-decoration:underline">Piano moving</a></div>';
  if (page0Done && !html.includes(linked)) {
    if (!html.includes(plain)) throw new Error('services__local-moving.html: piano row of the rate table not found');
    html = html.replace(plain, linked);
  } else if (!page0Done) html = html.replace(linked, plain);
  setText(local, html, 'piano row → /services/piano-movers');

  const wg = path.join(PAGES_DIR, 'services__white-glove-movers.html');
  html = text(wg);
  const note = ' Moving a piano? Our <a href="/services/piano-movers">piano movers in Los Angeles</a> have a page of their own.';
  const sp = markerSpan(html, 'piano-note');
  if (sp) html = replaceSpan(html, sp, page0Done ? note : '');
  else if (page0Done) {
    const anchor = html.indexOf('Our crew of pro movers will show up with every required tool');
    if (anchor < 0) throw new Error('services__white-glove-movers.html: paragraph for the piano sentence not found');
    const end = html.indexOf('</p>', anchor);
    html = html.slice(0, end) + wrapMarkers('piano-note', note) + html.slice(end);
  }
  setText(wg, html, 'piano sentence → /services/piano-movers');
}

// ---------- E. page 0 hub tasks ----------

console.log('\nE. хаб услуг, редиректы, склейка статей');
const MERGED = ['piano-movers-los-angeles-specialists', 'piano-movers-near-me-upright-vs-grand-piano'];
if (!page0Done) warn('page 0 is not done: hub card, redirects and the article merge are skipped');
else {
  // Hub card modeled on the white glove card.
  const hub = path.join(PAGES_DIR, 'services.html');
  let html = text(hub);
  const card = findAll(html, (c) => c.includes('why-s-block') && c.includes('is-services-page'))
    .filter((el) => html.slice(el.openEnd, el.closeStart).includes('href="/services/white-glove-movers"')).pop();
  if (!card) throw new Error('services.html: white glove card not found');
  const IMG = '/images/blog/645ab1d979228775565bf1fa_how-to-move-a-piano-the-right-way.jpg';
  const piano = html.slice(card.start, card.end)
    .replace(/(<h3\b[^>]*>)[^<]*(<\/h3>)/, (_, a, b) => `${a}Piano Movers${b}`)
    .replace(/(<div class="why-s-subtitle[^"]*">)[^<]*(<\/div>)/, (_, a, b) => `${a}Uprights and grands moved on a regular hourly move by a crew of four, with a $200 piano add-on.${b}`)
    .replace(/href="\/services\/white-glove-movers"/, 'href="/services/piano-movers"')
    .replace(/<img\b[^>]*>/g, (tag) => tag.replace(/\s(?:srcset|sizes)="[^"]*"/g, '')
      .replace(/\bsrc="[^"]*"/, () => `src="${IMG}"`).replace(/\balt="[^"]*"/, 'alt="piano-img"'));
  const sp = markerSpan(html, 'piano-card');
  html = sp ? replaceSpan(html, sp, piano) : html.slice(0, card.end) + wrapMarkers('piano-card', piano) + html.slice(card.end);
  setText(hub, html, 'Piano Movers card');

  // Redirects.
  const csvFile = path.join(SITE, 'src/data/broken-links-map-extra.csv');
  const csv = text(csvFile);
  const eol = csv.includes('\r\n') ? '\r\n' : '\n';
  const lines = csv.split(/\r?\n/);
  const tail = lines[lines.length - 1] === '' ? lines.pop() : null;
  for (let i = 1; i < lines.length; i++) {
    const f = lines[i].split(',');
    if (f[0] === '/services/piano-move') f[1] = '/services/piano-movers';
    if (MERGED.some((m) => f[1] === `/blog/${m}`)) f[1] = '/services/piano-movers';
    lines[i] = f.join(',');
  }
  for (const m of MERGED) {
    const i = lines.findIndex((l) => l.split(',')[0] === `/blog/${m}`);
    if (i < 0) lines.push(`/blog/${m},/services/piano-movers,blog->money-page,0`);
    else { const f = lines[i].split(','); f[1] = '/services/piano-movers'; lines[i] = f.join(','); }
  }
  if (tail !== null) lines.push(tail);
  setText(csvFile, lines.join(eol), 'redirects to /services/piano-movers');
  for (const l of fs.readFileSync(path.join(SITE, 'src/data/broken-links-map.csv'), 'utf8').split(/\r?\n/)) {
    const f = l.split(',');
    if (MERGED.some((m) => f[0] === `/blog/${m}` || f[1] === `/blog/${m}`)) warn(`broken-links-map.csv row touches a merged post: ${l}`);
  }

  // draft: true in the frontmatter of the merged posts (files stay).
  for (const m of MERGED) {
    const md = path.join(SITE, 'src/data/blog', `${m}.md`);
    const src = text(md);
    const fm = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fm) throw new Error(`${rel(md)}: no frontmatter`);
    if (/^draft:\s*true\s*$/m.test(fm[1])) continue;
    if (/^publishAt:/m.test(fm[1])) warn(`${rel(md)}: has publishAt — check it is not in the past`);
    const nl = src.includes('\r\n') ? '\r\n' : '\n';
    const next = /^draft:/m.test(fm[1])
      ? src.replace(/^draft:.*$/m, 'draft: true')
      : src.replace(/^(slug:.*)$/m, (l) => `${l}${nl}draft: true`);
    setText(md, next, 'draft: true');
  }

  // Internal links to the merged posts, all six forms, everywhere except the posts themselves.
  const tgt = `(?:https?://(?:www\\.)?sosmovingla\\.net)?(?:/blog/|(?:\\.\\./)+(?:blog/)?)(?:${MERGED.join('|')})/?(?:[?#][^"')\\s]*)?`;
  const HTML_A = new RegExp(`<a\\b[^>]*\\bhref="${tgt}"[^>]*>([\\s\\S]*?)</a>`, 'gi');
  const MD_A = new RegExp(`(?<!!)\\[([^\\]]*)\\]\\(${tgt}(?:\\s+"[^"]*")?\\)`, 'g');
  const own = new Set(MERGED.flatMap((m) => [path.join(PAGES_DIR, `blog__${m}.html`), path.join(SITE, 'src/data/blog', `${m}.md`)]));
  const scan = [
    ...fs.readdirSync(PAGES_DIR).filter((f) => f.endsWith('.html')).map((f) => path.join(PAGES_DIR, f)),
    ...fs.readdirSync(path.join(SITE, 'src/data/blog')).filter((f) => f.endsWith('.md')).map((f) => path.join(SITE, 'src/data/blog', f)),
  ].filter((f) => !own.has(f));
  for (const f of scan) {
    const src = text(f);
    const next = f.endsWith('.md') ? src.replace(MD_A, '$1').replace(HTML_A, '$1') : src.replace(HTML_A, '$1');
    if (next === src) continue;
    if (isProtected(f)) { warn(`${rel(f)} (PPC) links to a merged post — not edited`); continue; }
    setText(f, next, 'link to a merged piano post removed');
  }
  const mergedUrls = new Set(MERGED.flatMap((m) => [`/blog/${m}`, `/blog/${m}/`]));
  const before = seoMeta.data.length;
  seoMeta.data = seoMeta.data.filter((r) => !mergedUrls.has(r.url));
  if (seoMeta.data.length !== before) change(`seo-meta.json: − ${before - seoMeta.data.length} merged post records`);
  for (const name of ['wf-page-map', 'wf-bundle-map']) {
    const e = loadJson(path.join(SITE, 'public', `${name}.json`));
    for (const u of mergedUrls) if (u in e.data) { delete e.data[u]; change(`${name}.json: − ${u}`); }
  }
}

// ---------- E/H. links in blog bodies: HTML first, .md mirrored ----------

console.log('\nE/H. ссылки в статьях блога');
// Posts that cover this place and this service; the anchor is running text already in the post.
const BLOG_LINKS = [
  { post: 'piano-moving-cost-why-its-expensive', to: '/services/piano-movers', ctx: 'That $200 SOS Moving piano fee seems high', phrase: 'SOS Moving piano fee' },
  { post: 'how-to-move-a-piano-the-right-way', to: '/services/piano-movers', ctx: 'make the right decision and hire a professional piano moving company', phrase: 'hire a professional piano moving company' },
  { post: 'how-to-move-a-piano-up-stairs-safely-in-los-angeles', to: '/services/piano-movers', ctx: 'Need to move a piano in Los Angeles?', phrase: 'move a piano in Los Angeles' },
  { post: 'packing-in-a-hurry-for-your-burbank-move', to: '/burbank-packing-services', ctx: 'Here a few tips on how packing in a hurry for your Burbank move could succeed', phrase: 'packing in a hurry for your Burbank move' },
  { post: 'orange-county-to-san-francisco-moving-cost-guide-2026', to: '/orange-county-long-distance-movers', ctx: 'ready to make your long-distance move stress-free', phrase: 'long-distance move' },
];
{
  const perPost = new Map();
  const perPage = new Map();
  for (const l of BLOG_LINKS) {
    perPost.set(l.post, (perPost.get(l.post) || 0) + 1);
    perPage.set(l.to, (perPage.get(l.to) || new Set()).add(l.post));
  }
  for (const [k, v] of perPost) if (v > 3) throw new Error(`${k}: more than 3 new links`);
  // The limit of two posts is for section H; page 0 gets its three piano posts by section E.
  for (const [k, v] of perPage) if (k !== PAGE0.url && v.size > 2) throw new Error(`${k}: linked from more than 2 posts`);
}
for (const l of BLOG_LINKS) {
  const on = doneUrl(l.to);
  const variants = [
    [path.join(PAGES_DIR, `blog__${l.post}.html`), `<a href="${l.to}">${l.phrase}</a>`],
    [path.join(SITE, 'src/data/blog', `${l.post}.md`), `[${l.phrase}](${l.to})`],
  ];
  for (const [file, linked] of variants) {
    let src = text(file);
    const ctxLinked = l.ctx.replace(l.phrase, linked);
    if (on && !src.includes(ctxLinked)) {
      let at = src.indexOf(l.ctx);
      while (at >= 0 && file.endsWith('.html') && !inPlainText(src, at)) at = src.indexOf(l.ctx, at + 1);
      if (at < 0) {
        if (file.endsWith('.md')) warn(`${rel(file)}: text for the ${l.to} link not found — .md not mirrored (the body renders from HTML)`);
        else errors.push(`${rel(file)}: text for the ${l.to} link not found`);
        continue;
      }
      src = src.slice(0, at) + ctxLinked + src.slice(at + l.ctx.length);
    } else if (!on) src = src.split(ctxLinked).join(l.ctx);
    setText(file, src, `link → ${l.to}`);
  }
}

// ---------- F. city pages (non-PPC, geos of this wave) ----------

console.log('\nF. страницы городов');
const CARD_SERVICE = {
  'apartment movers': 'apartment', 'commercial movers': 'commercial', 'packing services': 'packing',
  'white glove movers': 'white-glove', 'storage services': 'storage', 'long-distance movers': 'long-distance',
};
const cityPagesOfWave = [...new Set(wavePages.filter((p) => isCityService(p) && !p.city_page_is_ppc).map((p) => p.city_page))];
for (const cityUrl of cityPagesOfWave) {
  const file = path.join(PAGES_DIR, urlToFile(cityUrl));
  if (PPC_URLS.includes(cityUrl) || isProtected(file)) throw new Error(`${cityUrl} is a PPC page`);
  const geoPages = live.filter((q) => q.city_page === cityUrl);
  let html = text(file);
  html = html.replace(/(<a href=")([^"]*)(" class="services-item[ "][^>]*>)([\s\S]*?<h3 class="services-h3">)([^<]*)(<\/h3>)/g,
    (m, a, href, b, mid, h3, c) => {
      const svc = CARD_SERVICE[h3.trim().toLowerCase()];
      if (!svc) return m;
      const q = geoPages.find((x) => x.service === svc && isDone(x));
      return a + (q ? q.url : SERVICE[svc].url) + b + mid + h3 + c;
    });
  const piano = geoPages.find((q) => q.service === 'piano' && isDone(q));
  const note = piano ? `<div class="section-subtitle" style="margin-top:2rem">Moving a piano too? See our <a href="${piano.url}" class="color-yellow">piano movers in ${esc(piano.geo)}</a>.</div>` : '';
  const sp = markerSpan(html, 'piano-note');
  if (sp) html = replaceSpan(html, sp, note);
  else if (note) {
    const grid = findAll(html, (c) => c[0] === 'services-wrapper')
      .find((el) => html.slice(el.openEnd, el.closeStart).includes('class="services-item'));
    if (!grid) throw new Error(`${rel(file)}: services grid not found`);
    html = html.slice(0, grid.end) + wrapMarkers('piano-note', note) + html.slice(grid.end);
  }
  setText(file, html, 'service cards → city × service pages, piano sentence');
}

// ---------- G. HTML sitemap ----------

console.log('\nG. HTML-карта');
{
  const file = path.join(PAGES_DIR, 'sitemap.html');
  let html = text(file);
  const li = '<li class="sitemap-list-item"><a href="/services/piano-movers" class="sitemap-link is-inner-link">Piano Movers</a></li>';
  const wgLi = '<li class="sitemap-list-item"><a href="/services/white-glove-movers" class="sitemap-link is-inner-link">White Glove Movers</a></li>';
  if (page0Done && !html.includes(li)) {
    if (!html.includes(wgLi)) throw new Error('sitemap.html: White Glove Movers item not found');
    html = html.replace(wgLi, wgLi + li);
  } else if (!page0Done) html = html.replace(li, '');

  const groups = ['Los Angeles County', 'Orange County'].map((county) => {
    const geos = [...new Set(live.filter((q) => isCityService(q) && q.county === county && isDone(q)).map((q) => q.geo))].sort();
    if (!geos.length) return '';
    const items = geos.map((g) => {
      const links = live.filter((q) => isCityService(q) && q.geo === g && isDone(q))
        .sort((a, b) => SERVICE[a.service].label.localeCompare(SERVICE[b.service].label))
        .map((q) => `<li class="sitemap-list-item"><a href="${q.url}" class="sitemap-link is-inner-link">${esc(SERVICE[q.service].label)}</a></li>`).join('');
      return `<li class="sitemap-list-item" style="color:#fff">${esc(g)}<ul role="list" class="sitemap-list" style="padding-top:.4rem;margin-bottom:1rem">${links}</ul></li>`;
    }).join('');
    return `<div class="sitemap-wrapper"><div class="sitemap-link" style="margin-bottom:0">${county}</div><ul role="list" class="sitemap-list">${items}</ul></div>`;
  }).join('');
  const block = groups ? `<div class="sitemap-column"><div class="sitemap-link">Moving Services by City</div>${groups}</div>` : '';
  const sp = markerSpan(html, 'sitemap-by-city');
  if (sp) html = replaceSpan(html, sp, block);
  else {
    const wrap = findAll(html, (c) => c.includes('is-sitemap-content-wrapper'))[0];
    if (!wrap) throw new Error('sitemap.html: content wrapper not found');
    html = html.slice(0, wrap.closeStart) + wrapMarkers('sitemap-by-city', block) + html.slice(wrap.closeStart);
  }
  setText(file, html, 'Piano Movers, «Moving Services by City»');
}

// ---------- checks: TODO-TZ17, duplicate descriptions, links from new pages ----------

console.log('\nпроверки');
for (const p of wavePages) {
  const rec = metaByUrl.get(p.url);
  if (rec && JSON.stringify(rec).includes(TODO)) { if (isDone(p)) errors.push(`seo-meta ${p.url}: ${TODO} left`); else warn(`seo-meta ${p.url}: ${TODO} left`); }
  const own = [
    isCityService(p) ? path.join(SITE, 'src/data/cities', `${p.slug}.json`) : path.join(SITE, 'src/data/services', `${p.url.split('/').pop()}.json`),
    path.join(SITE, 'src/data/jsonld', isCityService(p) ? `${p.slug}.json` : `services_${p.url.split('/').pop()}.json`),
    path.join(PAGES_DIR, `${p.slug}.html`),
  ];
  for (const f of own) if (fs.existsSync(f) && (textStore.get(f)?.cur ?? fs.readFileSync(f, 'utf8')).includes(TODO)) warn(`${rel(f)}: ${TODO} left (page agent's file, not edited)`);
  const html = textStore.get(path.join(PAGES_DIR, `${p.slug}.html`))?.cur;
  if (html && isDone(p)) {
    for (const m of html.matchAll(/href="([^"#?]*)"/g)) {
      const q = byUrl.get(m[1].replace(/\/$/, ''));
      if (q && q !== p && !isDone(q)) warn(`${p.slug} links to ${q.url} (${q.wave > wave ? `wave ${q.wave}` : statusOf(q) || 'no result'})`);
    }
  }
}
const liveUrls = new Set(live.map((p) => p.url));
for (const p of wavePages) {
  const d = (metaByUrl.get(p.url) || {}).description;
  if (!d || d === TODO) continue;
  const twins = seoMeta.data.filter((r) => r.url !== p.url && r.description === d && (!liveUrls.has(r.url) || r.url > p.url));
  for (const r of twins) warn(`same description: ${p.url} and ${r.url}`);
}

// ---------- I. progress ----------

const progress = loadJson(path.join(ROOT, 'tz/17-progress.json'));
for (const p of wavePages) {
  const st = statusOf(p);
  if (!st) continue;
  const cur = progress.data[p.slug] || (progress.data[p.slug] = { status: null, attempts: 0 });
  if (cur.status !== st) { change(`tz/17-progress.json: ${p.slug} ${cur.status} → ${st}`); cur.status = st; }
}

// ---------- write ----------

if (errors.length) {
  console.error(`\nОШИБКИ (${errors.length}), ничего не записано:`);
  for (const e of errors) console.error(`  × ${e}`);
  process.exit(1);
}
for (const c of avatarCopies) change(`public/images/reviews/${path.basename(c.dest)} ← reviews/avatars`);
if (!DRY) {
  for (const [file, e] of jsonStore) {
    const out = serialize(e.data, e.fmt);
    if (out === e.raw) continue;
    if (isProtected(file)) throw new Error(`refusing to write protected ${rel(file)}`);
    fs.writeFileSync(file, out);
  }
  for (const [file, e] of textStore) if (e.cur !== e.raw) fs.writeFileSync(file, e.cur);
  for (const c of avatarCopies) fs.copyFileSync(c.from, c.dest, fs.constants.COPYFILE_EXCL);
}

const n = changes.length;
const word = n % 10 === 1 && n % 100 !== 11 ? 'изменение' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'изменения' : 'изменений';
console.log(`\n${DRY ? 'DRY RUN, ничего не записано. План: ' : ''}${n} ${word}${warnings.length ? `, предупреждений: ${warnings.length}` : ''}`);
