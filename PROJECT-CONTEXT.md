# SOS Moving — Project Context for AI Sessions

> **Read this file FIRST before doing anything.** It is the single source of truth for current state, history, open decisions, and workflow rules. Last updated mid-session as Dmitriy prepared to `/clear` — use this to pick up where we left off.

---

## TL;DR — state on `main` right now

Cloning https://www.sosmovingla.net/ (original Webflow site) into Next.js. Live at https://sosmoving-2.vercel.app/ (Vercel auto-deploys `main`). Repo: https://github.com/Bankai-Agency/sosmoving.

**Stacks (4 route groups):**

| Group | Purpose | Pages |
|---|---|---:|
| `(webflow)/` | Pixel-perfect legacy clone — HTML via `dangerouslySetInnerHTML` + original `webflow.css` + jQuery/Slick/GSAP | ~920 |
| `(new-design)/` | Target React stack — Tailwind 4, framer-motion, Lenis. Hosts `/mainpage2` only. | 1 |
| `(admin)/` | CRM admin panel. Auth.js + Neon Postgres + BlockNote. **Built by Dmitriy in parallel** on `feat/admin-cms` branch. Not on `main` yet. | — |
| `(dev)/` | Dev-only component galleries `/dev/*`. NOT production. **Currently only local on `feat/admin-cms`** — not on `main` yet. | — |

**Page count on `main`:** ~939 static pages after adding 18 orphan routes (see commit `9ea9236`). Desktop PageSpeed **97**, mobile **~81** after perf work. Vercel deploys from `main`.

**Dmitriy works in a separate Claude Code session on `feat/admin-cms`** branch locally. That branch is never pushed — it contains his CRM work + some of my redesign WIP. I cherry-pick my commits to `main` when safe; I do NOT push his admin work.

---

## Commit history on `main` (most recent first)

```
9ea9236  fix: add missing routes for 18 orphan HTML pages (13 movers-* + 5 statics)
fbb810e  fix: add missing page.tsx routes for 3 about-us subpages
8b9bd56  content: apply site-edits.md bug fixes + content updates + meta descriptions
f94aebc  Revert "perf: self-host Lato fonts"   ← fixed regression
4263c71  perf: self-host Lato fonts (self-reverted — CLS regression)
c32bb1d  perf: defer vidzflow hero iframe via server-rendered facade  ← mobile LCP 10s → 3s
7bb96f5  perf: preload Webflow scripts + jQuery, dns-prefetch CDN origins
3771999  perf: slim Lato fonts from 10 to 3 variants + display:swap
e6b67c3  Add Claude Code tooling: Stop hook + parity-reviewer agent
3f1d021  Cleanup: remove dead QuoteForm + Globe, drop 14 unused deps
fd31741  Cleanup: remove 17 unused files, add nested city route (by Dmitriy)
6764dc3  docs: add COMPONENTS-AND-PAGES.md (by Dmitriy)
67183a8  Phase 2.5: Componentize all content sections via SectionRenderer (by Dmitriy)
f281700  Phase 2: Componentize shared blocks + fix relative paths
7979d27  Add /mainpage2 with new design stack
c2e71ce  Phase 1: jQuery pin 3.5.1, %2520 fix, image audit
```

---

## What was done this session (chronological)

### 1. Infrastructure
- **Stop hook** auto-updates `SESSION-LOG.md` after every assistant response (gitignored). Script: `scripts/update-session-log.mjs`. Config: `.claude/settings.json`.
- **`parity-reviewer` subagent** at `.claude/agents/parity-reviewer.md` — invoked before declaring any change "done". Has caught real bugs (crossOrigin mismatch on jQuery preload that would fetch jQuery twice; CLS regression from self-host fonts without size-adjust).

### 2. Cleanup (commit `3f1d021`)
- Deleted `src/components/forms/QuoteForm.tsx`, `src/components/mainpage2/ui/Globe.tsx` (0 imports).
- `npm uninstall`: 14 packages — `three`, `@types/three`, `topojson-client`, `@types/topojson-client`, `world-atlas`, `embla-carousel-react`, `react-markdown`, `rehype-raw`, `rehype-slug`, `remark-gfm`, `react-hook-form`, `@hookform/resolvers`, `react-imask`, `zod`. All verified 0 imports.

### 3. Performance journey — mobile Lighthouse score `62 → 81`
1. **Lato fonts 10→3 variants** (`3771999`): removed unused weights 100/300/900/italic — cut 250KB on initial load. Browser was already falling back for missing 500/600/800, so no visual regression.
2. **Preload hints** (`7bb96f5`): added `<link rel="preload">` for jQuery, 2 common Webflow chunks, and homepage-specific bundle. `dns-prefetch` for cdnjs/jsdelivr. Critical: **no `crossOrigin`** on jQuery preload because `ScriptLoader.tsx` creates the `<script>` without `crossorigin` — mismatch = double fetch.
3. **Vidzflow facade** (`c32bb1d`): **the big win**. Hero on `/` embeds a 9MB 1080p music video via `<iframe>`. At parse time, `src/lib/page-sections.ts` swaps every `<iframe src="vidzflow.com">` for `<div class="vidzflow-facade" data-src=...>`. `public/custom-scripts.js` hydrates the real iframe on `window.load + requestIdleCallback`. LCP **10.2s → 3.2s**. See both files.
4. **Self-host Lato attempt** (`4263c71`) → **reverted** (`f94aebc`). Caused CLS 0.003 → 0.069 because I forgot `size-adjust`/`ascent-override`. Vercel `cache-control: max-age=0` on `/public/fonts/` also didn't help. Correct approach = `next/font/google` (auto fallback metrics). Currently prod is back on Google Fonts Lato external stylesheet.

**Open issue:** 43 responsive image variants (`-p-500.webp` etc) missing. Browser falls back to base. Fix: `node scripts/generate-responsive-images.mjs`. Low priority.

### 4. Site-edits from `/Users/dmitriy/Downloads/site-edits.md` (commit `8b9bd56` + `fbb810e`)
Dmitriy provided a 28-item edit list. Applied 23 of 28 (skipped parts 3 navigation additions and navigation links pointing to pages he didn't want created):
- **Bug fixes** 1.1–1.4: Alex Park → Alex Zack, 2020 → 2019, 14 trucks → fleet of 40, PortlandOffice → Portland Office
- **Content** 2.1–2.4: new Who We Are block on `/about-us`, Org Structure on `/meet-our-team`, 3 new sections on `/services` (Institutional, Education, Specialty — CTAs link to `/free-estimate`), simpler `/book-online` subtitle
- **Meta descriptions** 1.2d + 1.5 (all except b/d/f): `export const metadata` added to 5 static `page.tsx` + `generateMetadata` with `CITY_META` record on `(cities)/[citySlug]/page.tsx` for beverly-hills / orange-county / portland / denver

### 5. Orphan route fixes (commits `fbb810e` + `9ea9236`)
Audit found 18 HTML files in `public/pages/` without route handlers. They worked in prod via Next's `dynamicParams=true` fallback, but served dynamic SSR not static. Fixed:
- **`(cities)/[citySlug]/page.tsx`** filter loosened from `f.includes('-movers')` to `f.includes('-movers') || f.startsWith('movers-')` — catches 13 `movers-{city}.html` files.
- Added `page.tsx` for `/moving-services`, `/book-online`, `/about-us/video-reviews`, `/about-us/influencer-program`, `/about-us/careers`, `/about-us/apartment-partnership`, `/confirmation-page-refer-friends-get-cash`, `/sitemap`.
- Page count jumped **921 → 939** static pages.

### 6. Full-site audit (3 parallel agents, all green)
- **Smoke test** (133 sampled URLs across every page type): **200 × 133**. Zero 404s, zero 5xx.
- **Structural audit**: 28/29 section types in the Section registry; 0 empty/malformed pages. Sole "unknown" is `__noclass__` — trailing empty `<div class="">` on 18 Oregon pages (harmless via `SharedSection`).
- **"106 missing images" was a false positive** — files exist with decoded names (Cyrillic, spaces, parens); HTML references them URL-encoded. Browser decodes automatically. Confirmed with `curl` → `200 OK` on all samples.

### 7. Component variants + page archetypes (detailed in `COMPONENTS-AND-PAGES.md` + agent report)
- **Hero has 13 variants** (not 12 as originally thought). Biggest: `services-hero-section is-blog-article-hero is-without-bg-image` (395 pages, blog posts + faq).
- **95% of site = 2 archetypes**: Blog Post (394 pages) + City Landing (114 pages).
- **29 one-off pages** (`index`, `moving-services`, `services`, `about-us/*`, `services/*`, edge cases).
- **Bleed-through bug**: `with-rating mobile aliso-viejo` class on 5 city heroes (copy-paste from template). Worth normalizing in redesign.
- **Degenerate structure**: `services/long-distance-movers` and `services/local-moving` have only 1 top-level div — Webflow wrapped everything in a single container. Needs custom rendering.

### 8. Redesign step 1 (local only on `feat/admin-cms`)
- **Commit `f9ccfb6`**: swap Lato → Inter Variable via `next/font/google` in `(webflow)/layout.tsx`. `globals.css` has `body, body * { font-family: var(--font-inter), ... !important; }` to override `font-family: Lato` in `webflow.css`. **Not yet on `main`.**
- **Dev gallery** (uncommitted, on `feat/admin-cms` stash `claude-session-wip-before-context-update`):
  - `src/app/(dev)/layout.tsx` — separate route group, no navbar/footer
  - `src/app/(dev)/dev/page.tsx` — landing with list of 23 component types
  - `src/app/(dev)/dev/[type]/page.tsx` — dynamic route, shows every variant of a type on one scroll
  - `src/lib/dev-gallery.ts` — utility that scans all 537 HTML files and groups sections by full className
  - `src/components/dev/VariantHeader.tsx` — yellow sticky bar above each variant

### 9. Typography research
Collected typography shapes from two reference sites Dmitriy considered for the redesign:
- **thegoatmovers.net** — Geist Variable. Scale: 40/96 H1, 32/64 H2, 28/42 H3, body 16/20. Tracking **proportional -3%**. Weight 700 headings, 400 body.
- **make-b.studio** — Neue Montreal Medium (paid). Tracking **constant -0.6px**. Weight 500 default. Line-heights tighter (1.2 on body).

**Dmitriy chose goatmovers style.** Not yet applied — next step is: switch Inter → Geist + add typography overrides in `(webflow)/globals.css` following the goatmovers scale.

---

## Current state by branch

### `main` (prod — https://sosmoving-2.vercel.app/)
- Latest: `9ea9236` + **an incoming docs update** (this commit)
- Font: Google Fonts Lato (400/400italic/700) via external `<link>` in layout — NO Inter yet
- 939 static pages after orphan fixes
- Site fully functional, all smoke tests green
- Perf: desktop 97, mobile ~81 (last measured)

### `feat/admin-cms` (Dmitriy's local only — never pushed)
Contains on top of `main`:
- Dmitriy's CRM work: `feat(admin)` commits (Auth.js Phase 1/2, image uploads Phase 3, theme provider, etc.)
- My redesign step 1: `f9ccfb6` Inter Variable swap (`(webflow)/layout.tsx` + `globals.css`)
- **Uncommitted stash** `claude-session-wip-before-context-update`:
  - Dev gallery files (`src/app/(dev)/**`, `src/lib/dev-gallery.ts`, `src/components/dev/VariantHeader.tsx`)
  - Untracked: `public/images/blog/596e27781129.png` (his upload)
- **His uncommitted CRM WIP** was stashed here too — safe to `git stash pop` when returning to this branch

---

## Workflow rules (important — read)

1. **Push to `main` only when Dmitriy explicitly says so.** He wants **hourly push discipline**. Accumulate commits locally first. Never push without a "go".
2. **`main` is the only branch on origin.** `feat/admin-cms` is Dmitriy's local workspace — don't try to push it or merge it in.
3. **I work on `main` when possible.** When forced to `feat/admin-cms` (e.g. Dmitriy has untracked files that block `git checkout main`), commit there locally and cherry-pick the hash to `main` when it's safe.
4. **`git stash push -u` with a `claude-` prefix** before branch switches to protect Dmitriy's uncommitted work. Always stash pop after returning.
5. **Never `git add -A`, never `--no-verify`, never `--force`, never amend.** Per `CLAUDE.md`.
6. **`sos-moving` repo is OFF LIMITS** — that's the external reference. Ours is `sosmoving`.
7. **Parity-reviewer before "done":** any change to `(webflow)/`, `public/pages/`, `webflow.css`, or `ScriptLoader.tsx` must go through the agent. It catches bugs a static read wouldn't.
8. **`public/fonts/` Vercel cache is bad** — if self-hosting fonts manually, `cache-control: max-age=0`. Use `next/font/google` which handles this + auto size-adjust.

---

## Immediate next steps (pick up here after `/clear`)

1. **Apply goatmovers typography scale** on `(webflow)/` stack:
   - Replace `Inter` with `Geist` in `(webflow)/layout.tsx` (`import { Geist } from "next/font/google"`, rename variable `--font-inter` → `--font-geist`).
   - Extend `(webflow)/globals.css` with typography overrides (see table below). Target selectors: `.services-hero-h1`, `.hero-h1`, `.section-h2`, `.section-h2-2`, `.bottom-cta-h2`, `.why-s-h3`, `h3`, body.
   - All overrides use `letter-spacing: -0.03em` (= -3%), `font-weight: 700` for H1/H2, `600` for H3.
   - Do it on `main` (after `git stash pop` of dev-gallery WIP, test, commit, push).

2. **Unstash dev gallery and cherry-pick to `main`** after Dmitriy gives the OK. Files are ready and ran fine at `http://localhost:3000/dev`.

3. **Continue redesign per Dmitriy's plan** — after typography, next is likely color scheme / spacing / button styles. Ask him for direction.

### goatmovers scale to apply (confirmed by Dmitriy)

| Role | Mobile | Desktop (≥1024px) | Weight | Letter-spacing | Line-height |
|---|---|---|---|---|---|
| **Display H1** (hero) | 40px | 96px | 700 | -3% (=-0.03em) | 1 |
| **H2** | 32px | 64px | 700 | -4% on desktop, -3% on mobile | 1.2 |
| **H3** | 28px | 42px | 600 | -3% | 1.2 |
| **Body XL** (lead) | 18px | 20px | 400 | -3% | 1.4 |
| **Body** | 16px | 20px | 400 | -3% | 1.4 |
| **Caption** | 12px | 12px | 500 | -3% or +2.5% for caps | 1.2 |
| **Button** | 14px | 16px | 600 | -3% | 1.2 |

Tracking formula: `letter-spacing = -0.03em` (proportional) everywhere; override to `-0.04em` on display-size H2 if needed for visual balance.

---

## Dev gallery (ready to ship when unstashed)

23 component types at `/dev/<type>`. URLs:
`/dev`, `/dev/hero`, `/dev/service-content`, `/dev/faq`, `/dev/latest-news`, `/dev/section-reviews`, `/dev/reviews-section`, `/dev/why-sos`, `/dev/services-grid`, `/dev/bottom-cta`, `/dev/locations-office`, `/dev/locations-slider`, `/dev/local-white-content`, `/dev/about-company`, `/dev/services-areas`, `/dev/contact`, `/dev/team`, `/dev/job`, `/dev/gallery-photo`, `/dev/blog-listing`, `/dev/milestones`, `/dev/touchbar`, `/dev/hero-form`, `/dev/delivery`.

Each page renders every unique className variant of that section type (grouped by full class string, sorted by usage count) with a yellow sticky header showing the variant index, total, className, page count, and sample source page.

---

## Key files quick ref

| File | Purpose |
|---|---|
| `CLAUDE.md` | Hard project rules — read first after this file |
| `COMPONENTS-AND-PAGES.md` | Full inventory of component variants + page archetypes (updated this session) |
| `SESSION-LOG.md` | Auto-generated every Stop-hook tick; gitignored; snapshot of current state |
| `src/app/(webflow)/layout.tsx` | Legacy root layout (webflow.css, ScriptLoader, SharedHtmlBlock) |
| `src/app/(webflow)/globals.css` | Responsive font-size cascade + CSS overrides + Inter body override (on `feat/admin-cms` only) |
| `src/app/(webflow)/(cities)/[citySlug]/page.tsx` | Dynamic city route — has `generateMetadata` with `CITY_META` |
| `src/lib/page-sections.ts` | HTML → section array parser. **Also has vidzflow iframe → facade swap.** |
| `src/components/ScriptLoader.tsx` | Client component — loads jQuery → Webflow → GSAP → plugins |
| `public/pages/*.html` | 537 Webflow HTML files — the rendering targets |
| `public/webflow.css` | 154KB minified Webflow CSS. Source of Lato font-family refs. |
| `public/custom-scripts.js` | Chatbot, exit popup, touchbar GSAP, **vidzflow facade hydration** |
| `public/wf-bundle-map.json` | URL → Webflow main bundle filename (for ScriptLoader) |
| `scripts/generate-responsive-images.mjs` | Regenerates `-p-500/800/1080/1600` WebP/AVIF variants |
| `scripts/update-session-log.mjs` | Stop-hook script — filesystem-only, <100ms |
| `.claude/agents/parity-reviewer.md` | Subagent for verifying changes before commit |
| `.claude/settings.json` | Project Claude Code config (Stop hook) |

---

## Known bugs / tech debt

1. **`with-rating mobile aliso-viejo`** bleed-through class on 5 city heroes — content-specific token pulled into a shared template. Cosmetic.
2. **`services/long-distance-movers` + `services/local-moving`** — only 1 top-level div each. Webflow wrapped everything in one container. Custom render required in redesign.
3. **`seattle-movers` missing `service-content-section #2`** — doesn't match City Landing archetype exactly. Unclear if bug or intentional.
4. **43 missing responsive image variants** (`-p-NNN.webp`). Run `scripts/generate-responsive-images.mjs` to regen.
5. **Pre-existing typecheck errors** (don't touch per Dmitriy):
   - `next.config.ts:8` — `eslint` config key deprecated
   - `src/lib/page-sections.ts:26, :48` — cheerio API drift
   - `public/webflow.schunk.*.js` — 7 minified vendor file lint noise
   - `src/components/mainpage2/ui/Animate.tsx:213` — `prefer-const`
6. **`src/data/blog/interstate-movers-state-to-state-legal-requirements.md`** — has a `САМОПРОВЕРКА:` Russian draft marker in published content (parity-reviewer flagged it). Worth deleting.

---

## Two reference sites we studied

| | **thegoatmovers.net** | **make-b.studio** |
|---|---|---|
| Stack | Next.js (Tailwind-ish) | Framer |
| Font | Geist Variable (free) | Neue Montreal Medium (paid) |
| Tracking | **Proportional -3%** | Constant -0.6px |
| Body weight | 400 | **500** |
| H1 mobile / desktop | 40/96 | 40/74 |
| Feel | Airbnb/Stripe bold | Linear/Framer subtle |

**Dmitriy picked goatmovers.** Direction = Geist + proportional tracking + bold headings.

---

## For the next session (after `/clear`)

Read order:
1. This file (`PROJECT-CONTEXT.md`)
2. `CLAUDE.md` (hard rules — Russian)
3. `COMPONENTS-AND-PAGES.md` (variants inventory)
4. `SESSION-LOG.md` (auto-generated snapshot)

Then start with:
- `git log --oneline -5` on `main` to see latest
- `git branch --show-current` to know where you are
- `git stash list` — if there's `claude-session-wip-before-context-update`, it's the dev gallery + some of Dmitriy's admin WIP from the previous session. Unstash carefully on `feat/admin-cms` only, not on `main`.

**Dmitriy's immediate ask:** apply goatmovers typography scale. See "Immediate next steps" above.
