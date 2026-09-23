#!/usr/bin/env node
// ТЗ 17 (tz/17-city-service-pages.md, «Скрипт подготовки волны»): prepares every page of one wave.
//
//   node sosmoving/scripts/tz17-scaffold.mjs --wave N [--dry-run]
//
// Idempotent: existing page files are never touched, shared JSON only gains missing records,
// review picks already in reviews/by-page-tz17.json are kept. A second run prints «0 изменений».
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = path.resolve(SITE, '..');
const PAGES_DIR = path.join(SITE, 'public/pages');
const REV = path.join(ROOT, 'reviews');

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry-run');
const wave = Number(argv[argv.indexOf('--wave') + 1]);
if (!argv.includes('--wave') || !Number.isInteger(wave) || wave < 1) {
  console.error('usage: node sosmoving/scripts/tz17-scaffold.mjs --wave N [--dry-run]');
  process.exit(1);
}

const TODO = 'TODO-TZ17';
const changes = [];
const warnings = [];
const change = (msg) => { changes.push(msg); console.log(`  + ${msg}`); };
const warn = (msg) => { warnings.push(msg); console.log(`  ! ${msg}`); };
const rel = (f) => path.relative(ROOT, f).replace(/\\/g, '/');

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

const store = new Map(); // file -> { data, fmt, dirty }

function loadJson(file, fallbackFmt) {
  if (store.has(file)) return store.get(file);
  let entry;
  if (fs.existsSync(file)) {
    const raw = fs.readFileSync(file, 'utf8');
    const fmt = detectFmt(raw);
    const data = JSON.parse(fmt.bom ? raw.slice(1) : raw);
    // Re-serialising must reproduce the file byte for byte, or the diff would carry noise.
    if (serialize(data, fmt) !== raw) throw new Error(`${rel(file)}: parse + serialize does not round-trip`);
    entry = { data, fmt, dirty: false, isNew: false };
  } else {
    entry = { data: null, fmt: fallbackFmt, dirty: false, isNew: true };
  }
  store.set(file, entry);
  return entry;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
}

function writeNew(file, content) {
  if (!DRY) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, { flag: 'wx' }); // wx: never overwrite
  }
}

// ---------- HTML: locate blocks for the tz17-links markers ----------

const TAG_RE = /<!--[\s\S]*?-->|<(script|style)\b(?:[^>"']|"[^"]*"|'[^']*')*>[\s\S]*?<\/\1\s*>|<(\/?)([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;

function* tags(html, from = 0) {
  const re = new RegExp(TAG_RE.source, 'g'); // own lastIndex: scans nest
  re.lastIndex = from;
  let m;
  while ((m = re.exec(html))) {
    if (!m[3]) continue; // comment or script/style block
    yield { start: m.index, end: re.lastIndex, close: m[2] === '/', name: m[3].toLowerCase(), attrs: m[4] || '' };
  }
}

// Matching close tag by counting tags of the same name: robust to unclosed <p>/<li> inside.
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
  for (const t of tags(html)) if (!t.close && pred(classTokens(t.attrs))) out.push(element(html, t.start));
  return out;
}

// Direct children of an element, all of which must satisfy pred.
function childrenAll(html, el, pred) {
  let pos = el.openEnd;
  const kids = [];
  while (true) {
    const ws = html.slice(pos, el.closeStart).match(/^\s*/)[0].length;
    pos += ws;
    if (pos >= el.closeStart) break;
    const t = tags(html, pos).next().value;
    if (!t || t.start !== pos || t.close || !pred(classTokens(t.attrs))) return null;
    const kid = element(html, pos);
    kids.push(kid);
    pos = kid.end;
  }
  return kids;
}

const MARK = (kind, name) => `<!-- tz17-links:${kind}:${name} -->`;

// Named marker pairs for the blocks tz17-links.mjs owns (agreed deviation from the single
// unnamed pair of the spec). Always inside existing root sections — renderPage() keeps
// comments inside a section but drops anything between root elements.
function insertMarkers(html) {
  // The service templates carry marker pairs of their own (by-city, piano-note, piano-card),
  // put there by tz17-links.mjs. A page copied from a template must not inherit them: those
  // blocks belong to the service pages and nothing would ever refresh them here.
  html = html.replace(/<!--\s*tz17-links:start:(by-city|piano-note|piano-card)\s*-->[\s\S]*?<!--\s*tz17-links:end:\s*-->/g, '');
  const ins = [];
  const found = [];

  const slider = findAll(html, (c) => /^locations-slider(-\d+)?$/.test(c[0]) && c.includes('slider'))[0];
  const slides = slider && childrenAll(html, slider, (c) => /^locations-slide(-\d+)?$/.test(c[0]));
  if (slides && slides.length) {
    ins.push([slides[0].start, MARK('start', 'slider')], [slides.at(-1).end, MARK('end', 'slider')]);
    found.push(`slider(${slides.length})`);
  }

  const revSlider = findAll(html, (c) => c[0] === 'reviews-slider' && c.includes('slider'))
    .find((el) => html.slice(el.openEnd, el.closeStart).includes('class="reviews-item'));
  const revSlides = revSlider && childrenAll(html, revSlider, (c) => c[0] === 'reviews-slide');
  if (revSlides && revSlides.length) {
    ins.push([revSlides[0].start, MARK('start', 'reviews')], [revSlides.at(-1).end, MARK('end', 'reviews')]);
    found.push(`reviews(${revSlides.length})`);
  }

  const faq = findAll(html, (c) => c[0] === 'faq-wrapper')[0];
  if (faq) {
    ins.push([faq.end, MARK('start', 'other-services') + MARK('end', 'other-services')]);
    found.push('other-services');
  }

  let out = html;
  for (const [pos, text] of ins.sort((a, b) => b[0] - a[0])) out = out.slice(0, pos) + text + out.slice(pos);
  return { html: out, found };
}

// ---------- inputs ----------

const pagesAll = readJson(path.join(ROOT, 'tz/17-pages.json')).pages;
const pages = pagesAll.filter((p) => p.wave === wave).sort((a, b) => a.n - b.n);
if (!pages.length) { console.error(`no pages in wave ${wave}`); process.exit(1); }
console.log(`ТЗ 17 · волна ${wave} · ${pages.length} страниц${DRY ? ' · DRY RUN' : ''}`);

const isServicePage = (p) => p.url.startsWith('/services/');
const tplSvc = (p) => path.basename(p.template, '.html').replace(/^services__/, ''); // white-glove-movers
const svcSlug = (p) => p.url.replace('/services/', '');
const htmlFile = (p) => path.join(PAGES_DIR, `${p.slug}.html`);
const dataFile = (p) => (isServicePage(p)
  ? path.join(SITE, 'src/data/services', `${svcSlug(p)}.json`)
  : path.join(SITE, 'src/data/cities', `${p.slug}.json`));
const jsonldName = (p) => (isServicePage(p) ? `services_${svcSlug(p)}.json` : `${p.slug}.json`);

const seoMeta = loadJson(path.join(SITE, 'src/data/seo-meta.json'));
const cityReg = loadJson(path.join(SITE, 'src/data/cities/_registry.json'));
const svcReg = loadJson(path.join(SITE, 'src/data/services/_registry.json'));
const pageMap = loadJson(path.join(SITE, 'public/wf-page-map.json'));
const bundleMap = loadJson(path.join(SITE, 'public/wf-bundle-map.json'));
const metaByUrl = new Map(seoMeta.data.map((r) => [r.url, r]));

// Formats of new per-page files follow their samples: ТЗ 14 city data, service data, template JSON-LD.
const fmtOf = (file) => detectFmt(fs.readFileSync(file, 'utf8'));
const CITY_SAMPLE = path.join(SITE, 'src/data/cities/encino-movers.json');
const cityKeys = Object.keys(readJson(CITY_SAMPLE));

const tplHtmlCache = new Map();
const tplHtml = (p) => {
  if (!tplHtmlCache.has(p.template)) tplHtmlCache.set(p.template, fs.readFileSync(path.join(SITE, p.template), 'utf8'));
  return tplHtmlCache.get(p.template);
};

// ---------- steps 1–5 per page ----------

for (const p of pages) {
  console.log(`\n[${p.n}] ${p.url}  (${tplSvc(p)})`);
  const tplUrl = `/services/${tplSvc(p)}`;
  const tplMeta = metaByUrl.get(tplUrl);
  if (!tplMeta) throw new Error(`seo-meta has no record for template ${tplUrl}`);

  // 1. HTML from the template, with marker pairs — only if the file does not exist.
  if (!fs.existsSync(htmlFile(p))) {
    const { html, found } = insertMarkers(tplHtml(p));
    for (const need of ['slider', 'reviews', 'other-services']) {
      if (!found.some((f) => f.startsWith(need))) warn(`${p.template}: no ${need} block found, marker pair not inserted`);
    }
    writeNew(htmlFile(p), html);
    change(`${rel(htmlFile(p))} ← ${path.basename(p.template)} [${found.join(', ')}]`);
  }

  // 2. Registry.
  if (isServicePage(p)) {
    if (!svcReg.data.some((r) => r.slug === svcSlug(p))) {
      const rec = { slug: svcSlug(p), title: p.h1 };
      const i = svcReg.data.findIndex((r) => r.slug > rec.slug); // this registry is kept alphabetical
      svcReg.data.splice(i < 0 ? svcReg.data.length : i, 0, rec);
      svcReg.dirty = true;
      change(`src/data/services/_registry.json: ${rec.slug}`);
    }
  } else if (!cityReg.data.some((r) => r.slug === p.slug)) {
    cityReg.data.push({ slug: p.slug, parentSlug: null });
    cityReg.dirty = true;
    change(`src/data/cities/_registry.json: ${p.slug}`);
  }

  // 3. seo-meta, modelled on the template record; og/twitter follow the parent service page.
  if (!metaByUrl.has(p.url)) {
    const parent = (p.parent_service && metaByUrl.get(p.parent_service)) || tplMeta;
    const social = (obj, prefix) => Object.fromEntries(Object.entries(obj || {}).map(([k, v]) => [k,
      k === `${prefix}:title` ? p.title : k === `${prefix}:description` ? TODO : v]));
    const rec = {};
    for (const k of Object.keys(tplMeta)) {
      switch (k) {
        case 'url': rec.url = p.url; break;
        case 'title': rec.title = p.title; break;
        case 'description': rec.description = TODO; break;
        case 'canonical': rec.canonical = new URL(tplMeta.canonical).origin + p.url; break;
        case 'robots': rec.robots = ''; break;
        case 'h1': rec.h1 = p.h1; break;
        case 'og': rec.og = social(parent.og, 'og'); break;
        case 'twitter': rec.twitter = social(parent.twitter, 'twitter'); break;
        case 'jsonldFile': rec.jsonldFile = `data/jsonld/${jsonldName(p)}`; break;
        case 'jsonldExpected': rec.jsonldExpected = 1; break;
        default: rec[k] = tplMeta[k]; // lang and anything else: as in the template
      }
    }
    if (!('jsonldFile' in rec)) Object.assign(rec, { jsonldFile: `data/jsonld/${jsonldName(p)}`, jsonldExpected: 1 });
    seoMeta.data.push(rec);
    metaByUrl.set(p.url, rec);
    seoMeta.dirty = true;
    change(`src/data/seo-meta.json: ${p.url}`);
  }

  // 4. Webflow page id and bundle of the template.
  for (const [entry, name] of [[pageMap, 'wf-page-map'], [bundleMap, 'wf-bundle-map']]) {
    if (!(p.url in entry.data)) {
      if (!(tplUrl in entry.data)) throw new Error(`${name}.json has no ${tplUrl}`);
      entry.data[p.url] = entry.data[tplUrl];
      entry.dirty = true;
      change(`public/${name}.json: ${p.url}`);
    }
  }

  // 5a. Data layer file.
  const svcDataFile = path.join(SITE, 'src/data/services', `${tplSvc(p)}.json`);
  if (!fs.existsSync(dataFile(p))) {
    const svc = readJson(svcDataFile);
    const vals = {
      slug: isServicePage(p) ? svcSlug(p) : p.slug,
      parentSlug: null,
      title: p.title,
      metaDescription: TODO,
      canonicalUrl: p.url,
      heroTitle: p.h1,
      heroSubtitle: TODO,
      heroImage: svc.heroImage,
      phone: svc.phone,
      sections: [],
      sectionOrder: svc.sectionOrder,
      faq: [],
    };
    const keys = isServicePage(p) ? Object.keys(svc) : cityKeys;
    const obj = Object.fromEntries(keys.map((k) => [k, k in vals ? vals[k] : svc[k]]));
    writeNew(dataFile(p), serialize(obj, fmtOf(isServicePage(p) ? svcDataFile : CITY_SAMPLE)));
    change(`${rel(dataFile(p))}`);
  }

  // 5b. JSON-LD modelled on the template's block.
  const ldFile = path.join(SITE, 'src/data/jsonld', jsonldName(p));
  if (!fs.existsSync(ldFile)) {
    let baseFile = path.join(SITE, 'src/data/jsonld', `services_${tplSvc(p)}.json`);
    let ld = readJson(baseFile);
    if (!ld.name || !ld.address) {
      // services_commercial-movers.json is a bare FAQPage. The other service templates carry the
      // same MovingCompany block apart from name/url/description, which are replaced below anyway.
      warn(`${rel(baseFile)} is ${ld['@type']}, not a business block: MovingCompany taken from services_white-glove-movers.json`);
      baseFile = path.join(SITE, 'src/data/jsonld', 'services_white-glove-movers.json');
      ld = readJson(baseFile);
    }
    ld.name = `SOS Moving - ${p.h1}`;
    ld.url = new URL(tplMeta.canonical).origin + p.url;
    ld.description = TODO;
    const CA = { '@type': 'State', name: 'California' };
    const county = (name) => ({ '@type': 'AdministrativeArea', name, containedInPlace: CA });
    ld.areaServed = isServicePage(p)
      ? [county('Los Angeles County'), county('Orange County')]
      : p.geo === p.county
        ? county(p.county)
        : { '@type': 'City', name: p.geo, containedInPlace: county(p.county) };
    if (p.service === 'piano') delete ld.priceRange;
    // aggregateRating stays only where the page shows the same numbers (4.9 and 1007 reviews).
    if (!/Rated 4\.9<[\s\S]{0,1500}?1,?007 reviews/.test(tplHtml(p))) delete ld.aggregateRating;
    // The template's review list quotes the site-wide cards; this page shows its own six.
    delete ld.review;
    writeNew(ldFile, serialize(ld, fmtOf(baseFile)));
    change(`${rel(ldFile)} [${Object.keys(ld).length} keys${'aggregateRating' in ld ? '' : ', no aggregateRating'}${'priceRange' in ld ? '' : ', no priceRange'}]`);
  }
}

if (wave === 1) {
  const route = fs.readFileSync(path.join(SITE, 'src/app/(webflow)/(cities)/[citySlug]/page.tsx'), 'utf8');
  if (!/getAllCitySlugs|_registry/.test(route)) warn('[citySlug]/page.tsx: generateStaticParams() does not read the cities registry yet (see «Роут»)');
}

// ---------- 6. reviews ----------

// Keyword lists: tz/15 «Как искать услугу»; long distance and piano added for ТЗ 17.
const SERVICE_KW = {
  apartment: /\b(apartments?|condos?|elevators?|high-rise|walk-up)\b/gi,
  commercial: /\b(office move|office relocation|our office|my office|business|commercial|warehouse|restaurant|clinic)\b/gi,
  packing: /\b(packed|packing|wrap|wrapped|bubble wrap|unpack\w*)\b/gi,
  storage: /\b(storage|stored)\b/gi,
  // No "piano" here, unlike tz/15: piano reviews belong to the piano pages.
  'white-glove': /\b(antiques?|artworks?|fragile|delicate|marble|chandeliers?|heirlooms?|valuables?|white[- ]glove|pool table|billiard)\b/gi,
  piano: /\bpianos?\b/gi,
  'long-distance': /\b(long[- ]distance|cross[- ]country|out[- ]of[- ]state|interstate|across the country|state to state)\b/gi,
};
// tz/15 verdicts of a human on the same keyword lists: a "no" there holds here too.
const TZ15_PAGE = { apartment: 'services__apartment-movers', commercial: 'services__commercial-movers', packing: 'services__packing-services', storage: 'services__storage', 'white-glove': 'services__white-glove-movers' };
// Read in ТЗ 17 wave 1: the keyword matched, the review is not about the service. Key: "<service>:<rid>".
// The review stays available for tiers C and D. Packing follows the tz/15 reading: furniture or
// transport wrap, loading the truck, or packing done by the customer do not count.
const DENY = {
  'commercial:yelp-879ae1651c': 'a commercial fridge: one appliance, not a business move',
  'commercial:yelp-8c73bc26e2': '"their business" is SOS; the reviewer only called',
  'commercial:yelp-9255b8c4a9': '"this business" is SOS; a home move',
  'commercial:yelp-ae3a74ba97': '"got down to business": a home move',
  'commercial:yelp-b650e4954d': '"family business" is SOS',
  'commercial:yelp-c6128ce181': '"got right to business": a home move',
  'commercial:yelp-f6675d9a2d': '"this business" is SOS',
  'long-distance:yelp-8c73bc26e2': 'the reviewer only called, never moved with SOS',
  'white-glove:yelp-8c6deff7b4': '"delicate": small items for the client\'s car',
  'white-glove:yelp-9d1ff0d41e': 'an office move: kept for commercial',
  'white-glove:yelp-eeeff2bd90': 'an office move: kept for commercial',
  'storage:yelp-c806eb3e99': '"stored" in the truck during transport',
  'storage:yelp-eeefb8cd06': 'office files picked up from storage: kept for commercial',
  'storage:yelp-f071976d99': '"storage areas" are places in the new home',
  'apartment:yelp-82aeb01c1b': '"elevator": a fridge and tile job, not an apartment move',
  'packing:yelp-848e265b81': 'packing supplies brought, packing not said',
  'packing:yelp-862f373318': 'plastic wrap and blankets for transport',
  'packing:yelp-8679c3fa2a': '"truck packing" is loading',
  'packing:yelp-9067a5757d': 'transport wrap',
  'packing:yelp-91529b9cce': 'transport wrap',
  'packing:yelp-93aebbde76': 'the customer packed, the crew wrapped',
  'packing:yelp-979119f0ed': 'cabinets wrapped for transport',
  'packing:yelp-97de0a83e5': 'transport wrap',
  'packing:yelp-99684dab8d': 'transport wrap',
  'packing:yelp-9d1ff0d41e': 'an office move, transport wrap',
  'packing:yelp-a1aabf43dc': 'the customer packed, the crew wrapped',
  'packing:yelp-a3f564c573': '"packing everything so quickly": packing or loading is unclear',
  'packing:yelp-a484f49810': 'transport wrap',
  'packing:yelp-a4991483a5': '"packed well": packing or loading is unclear',
  'packing:yelp-a6836e538a': 'furniture wrapping only',
  'packing:yelp-a9b4dc25f6': '"packed everything": packing or loading is unclear',
  'packing:yelp-aa54822575': 'furniture wrapping only',
  'packing:yelp-acbca30a85': '"packed, secured, and transported": unclear',
  'packing:yelp-afadb96cc3': 'furniture and TV wrapping, the customer\'s boxes',
  'packing:yelp-afbc8893fd': '"packed quickly": unclear',
  'packing:yelp-b16947f7b0': 'transport wrap',
  'packing:yelp-b7c442548a': 'transport wrap',
  'packing:yelp-bcc8bd9952': '"packed with care": unclear',
  'packing:yelp-bff9ec18a8': '"packed everything so there was no damage": unclear',
  'packing:yelp-c573eddcae': 'the customer packed',
  'packing:yelp-c678344fe3': 'transport wrap',
  'packing:yelp-c796396cce': 'the customer packed and labelled the boxes',
  'packing:yelp-c806eb3e99': 'transport wrap',
  'packing:yelp-ca5529e493': 'packing supplies brought, packing not said',
  'packing:yelp-ccaff594f2': '"nicely packed": unclear',
  'packing:yelp-cda889697a': '"packed beautifully": unclear',
  'packing:yelp-cf16d8340d': 'furniture out of a rental building: transport wrap',
  'packing:yelp-cfded479e9': '"packed and protected": unclear',
  'packing:yelp-d3b4a44ee2': '"packed and moved": unclear',
  'packing:yelp-d4a66f81c0': 'furniture wrapping only',
  'packing:yelp-d7a926d087': '"packed everything with care": unclear',
  'packing:yelp-df0bfd3f97': '"packed with care": unclear',
  'packing:yelp-e0b652755c': 'transport wrap',
  'packing:yelp-e1556ce2b4': 'transport wrap',
  'packing:yelp-e3a11e0438': 'packing supplies brought, packing not said',
  'packing:yelp-e48d2ca746': 'the customer\'s colour-coded boxes; "wrapped and packed" unclear',
  'packing:yelp-e626d555e1': 'transport wrap',
  'packing:yelp-e7861bf584': 'furniture wrapping only',
  'packing:yelp-e8aaf4e5d6': 'transport wrap',
  'packing:yelp-e92944615e': 'furniture wrapping only',
  'packing:yelp-e99d99ba15': 'transport wrap',
  'packing:yelp-ed4505fae2': 'transport wrap',
  'packing:yelp-eeefb8cd06': 'pallets wrapped at an office move',
  'packing:yelp-f171d3b5ef': 'transport wrap',
  'packing:yelp-f1c3507bef': 'the customer unpacked',
  'packing:yelp-f877ae5608': '"packed into their truck" is loading',
  'packing:yelp-fb9cc63c14': 'wrapped what was not boxed',
  'packing:yelp-fd7b9c39a4': '"packed everything": unclear',
  'packing:yelp-fdea0ee317': 'packed the truck: loading',
  'packing:yelp-fe6dbd84f5': 'the customer unpacked',
};

// Pool tags are city-page slugs. Orange County is the county page plus the OC cities in the pool.
const OC_TAGS = ['orange-county-movers', 'irvine-movers', 'anaheim-movers', 'movers-fullerton', 'costa-mesa-movers',
  'huntington-beach-movers', 'newport-beach-movers', 'tustin-movers', 'yorba-linda-movers', 'movers-westminster',
  'santa-ana-movers', 'brea-movers', 'aliso-viejo-movers', 'movers-garden-grove', 'placentia-movers', 'la-habra-movers',
  'fountain-valley-movers', 'movers-buena-park', 'mission-viejo-movers', 'laguna-beach-movers', 'laguna-niguel-movers',
  'dana-point-movers'];
const EXTRA_PLACE = { 'orange county': OC_TAGS, 'los angeles': ['la-movers', 'los-angeles-movers'] };
// Outside LA County and OC: never tier B or D.
const OUT_OF_REGION = new Set(['movers-seattle', 'seattle-movers', 'portland-movers', 'denver-movers', 'chino-hills-movers',
  'corona-movers', 'ontario-movers', 'rancho-cucamonga-movers', 'upland-movers', 'fontana-movers', 'simi-valley-movers',
  'san-francisco-movers']);

const SLOTS = 6;
const TIERS = ['A', 'B', 'C', 'D'];

const lettersKey = (t) => Array.from(t.normalize('NFKC')).filter((ch) => /\p{L}/u.test(ch)).join('').toLowerCase().slice(0, 60);
const unescapeHtml = (s) => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' })[e]);

// The 11 site-wide cards: the reviews section most pages share (as in tz/15).
function commonBlockKeys() {
  const counts = new Map();
  for (const f of fs.readdirSync(PAGES_DIR)) {
    if (!f.endsWith('.html')) continue;
    const m = fs.readFileSync(path.join(PAGES_DIR, f), 'utf8').match(/<section[^>]*class="reviews-section[\s\S]*?<\/section>/);
    if (m) counts.set(m[0], (counts.get(m[0]) || 0) + 1);
  }
  const block = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const texts = [...block.matchAll(/class="reviews-review-text">([\s\S]*?)<\/div>/g)].map((m) => m[1]);
  if (texts.length !== 11) throw new Error(`site-wide reviews block: ${texts.length} cards, expected 11`);
  return new Set(texts.map((t) => lettersKey(unescapeHtml(t.replace(/<[^>]+>/g, ' ')))));
}

const byPageFile = path.join(REV, 'by-page-tz17.json');
const byPage = loadJson(byPageFile, fmtOf(path.join(REV, 'by-page-new.json')));
if (byPage.isNew) byPage.data = {};
const toFill = pages.filter((p) => !(p.slug in byPage.data));

console.log(`\n[отзывы] ${pages.length - toFill.length} страниц уже с отзывами, раздать: ${toFill.length}`);
if (toFill.length) {
  const pool = readJson(path.join(REV, 'pool.json'));
  const ridsOf = (obj) => Object.values(obj).flat().map((x) => (typeof x === 'string' ? x : x.rid));
  const taken = new Set([
    ...ridsOf(readJson(path.join(REV, 'by-page-new.json'))),
    ...ridsOf(readJson(path.join(REV, 'by-city.json'))),
    ...ridsOf(readJson(path.join(REV, 'excluded.json'))),
    ...ridsOf(readJson(path.join(REV, 'review-queue.json'))),
    ...ridsOf(byPage.data),
  ]);
  const poolIds = new Set(pool.map((r) => r.rid));
  for (const k of Object.keys(DENY)) {
    const [service, rid] = k.split(':');
    if (!SERVICE_KW[service] || !poolIds.has(rid)) throw new Error(`DENY: bad key ${k}`);
  }
  const common = commonBlockKeys();
  const eye = readJson(path.join(REV, 'tz15-eye-check.json'));
  const denied = (service, rid) => {
    if (DENY[`${service}:${rid}`]) return DENY[`${service}:${rid}`];
    const v = eye[TZ15_PAGE[service]]?.[rid];
    return v && v !== 'yes' ? `tz15 ${v}` : null;
  };
  const free = pool
    .filter((r) => !taken.has(r.rid) && !common.has(lettersKey(r.text)))
    .sort((a, b) => (a.rid < b.rid ? -1 : a.rid > b.rid ? 1 : 0));
  const hasAvatar = (r) => !r.defaultAvatar && fs.existsSync(path.join(REV, 'avatars', `${r.rid}.jpg`));
  const tagsOf = (r) => new Set([...(r.cities || []), ...(r.citiesInText || [])]);
  const svcHit = (service, r) => { SERVICE_KW[service].lastIndex = 0; return SERVICE_KW[service].test(r.text) && !denied(service, r.rid); };
  console.log(`  свободно в пуле: ${free.length} (google ${free.filter((r) => r.src === 'google').length}, yelp ${free.filter((r) => r.src === 'yelp').length})`);

  const cands = new Map();
  for (const p of toFill) {
    const place = new Set([p.city_page.slice(1).replace('/', '__'), ...(EXTRA_PLACE[p.geo_key] || [])]);
    const t = { A: [], B: [], C: [], D: [] };
    for (const r of free) {
      const tags = tagsOf(r);
      const here = [...tags].some((x) => place.has(x));
      const inRegion = ![...tags].some((x) => OUT_OF_REGION.has(x));
      const svc = svcHit(p.service, r);
      const tier = here && svc ? 'A' : svc && inRegion ? 'B' : here ? 'C' : inRegion && hasAvatar(r) ? 'D' : null;
      if (tier) t[tier].push(r);
    }
    cands.set(p.slug, t);
  }

  // Round-robin within a tier, relevance before mix. Each round the page with the fewest cards
  // so far picks first, then the one with fewer candidates: scarce relevant reviews spread
  // over pages instead of piling up on one.
  // Platform caps: 3 per platform first, then 4; only when the other platform has nothing left
  // for the page does one platform go beyond 4 (there are no free Google reviews at all).
  const state = new Map(toFill.map((p) => [p.slug, { picks: [], google: 0, yelp: 0 }]));
  const used = new Set();
  for (const cap of [3, 4, SLOTS]) {
    for (const tier of TIERS) {
      for (let progress = true; progress;) {
        progress = false;
        const order = toFill
          .filter((p) => cands.get(p.slug)[tier].length)
          .sort((a, b) => state.get(a.slug).picks.length - state.get(b.slug).picks.length
            || cands.get(a.slug)[tier].length - cands.get(b.slug)[tier].length || a.n - b.n);
        for (const p of order) {
          const st = state.get(p.slug);
          if (st.picks.length >= SLOTS) continue;
          const r = cands.get(p.slug)[tier].find((c) => !used.has(c.rid) && st[c.src] < cap);
          if (!r) continue;
          st.picks.push({ r, tier });
          st[r.src]++;
          used.add(r.rid);
          progress = true;
        }
      }
    }
  }

  const snippet = (service, text) => {
    const t = text.replace(/\s*\n\s*/g, ' / ');
    const re = new RegExp(SERVICE_KW[service].source, 'gi');
    const spans = [];
    for (const m of t.matchAll(re)) {
      const a = Math.max(0, m.index - 160), b = Math.min(t.length, m.index + m[0].length + 160);
      if (spans.length && a <= spans.at(-1)[1]) spans.at(-1)[1] = b; else spans.push([a, b]);
    }
    return t.length <= 480 ? t : spans.map(([a, b]) => t.slice(a, b)).join(' … ');
  };

  for (const p of toFill) {
    const st = state.get(p.slug);
    const c = cands.get(p.slug);
    // Slider order: A → B → C, then the mix alternating Google / Yelp.
    const rel_ = st.picks.filter((x) => x.tier !== 'D').sort((a, b) => TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier));
    const mixG = st.picks.filter((x) => x.tier === 'D' && x.r.src === 'google');
    const mixY = st.picks.filter((x) => x.tier === 'D' && x.r.src === 'yelp');
    const mix = [];
    while (mixG.length || mixY.length) { if (mixG.length) mix.push(mixG.shift()); if (mixY.length) mix.push(mixY.shift()); }
    const final = [...rel_, ...mix];
    console.log(`  ${p.slug} [${p.service}] кандидаты A${c.A.length} B${c.B.length} C${c.C.length} D${c.D.length} → ${final.map((x) => x.tier).join('')} (google ${st.google}, yelp ${st.yelp})`);
    for (const x of final.filter((x) => x.tier === 'A' || x.tier === 'B')) {
      console.log(`      ${x.tier} ${x.r.rid}: ${snippet(p.service, x.r.text)}`);
    }
    if (final.length < SLOTS) warn(`${p.slug}: only ${final.length} reviews`);
    if (st.google > 4 || st.yelp > 4) warn(`${p.slug}: ${Math.max(st.google, st.yelp)} cards from one platform (no free ${st.google > 4 ? 'Yelp' : 'Google'} reviews left)`);
    byPage.data[p.slug] = final.map((x) => ({ rid: x.r.rid, tier: x.tier }));
  }
  byPage.dirty = true;
  change(`reviews/by-page-tz17.json: ${toFill.length} pages`);
}

// ---------- 7. progress ----------

const progress = loadJson(path.join(ROOT, 'tz/17-progress.json'), { bom: false, eol: '\n', indent: '  ', trailing: true });
if (progress.isNew) progress.data = {};
if (wave === 1 && !progress.data.base_sha) {
  const sha = execSync('git rev-parse HEAD', { cwd: SITE, encoding: 'utf8' }).trim();
  progress.data = { base_sha: sha, ...progress.data };
  progress.dirty = true;
  change(`tz/17-progress.json: base_sha ${sha}`);
}
const missing = pages.filter((p) => !(p.slug in progress.data));
for (const p of missing) progress.data[p.slug] = { status: 'scaffolded', attempts: 0 };
if (missing.length) { progress.dirty = true; change(`tz/17-progress.json: ${missing.length} pages scaffolded`); }

// ---------- write shared files ----------

for (const [file, entry] of store) {
  if (!entry.dirty || DRY) continue;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, serialize(entry.data, entry.fmt));
}

const n = changes.length;
const word = n % 10 === 1 && n % 100 !== 11 ? 'изменение' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'изменения' : 'изменений';
console.log(`\n${DRY ? 'DRY RUN, ничего не записано. План: ' : ''}${n} ${word}${warnings.length ? `, предупреждений: ${warnings.length}` : ''}`);
