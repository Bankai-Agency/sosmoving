// Fix legacy absolute sosmovingla.net links in the scraped blog content.
// The old site had flat blog URLs, *-move service slugs and a few city
// pages that no longer exist; the scrape kept them as absolute hrefs, so
// they 404 on the current site (found via a full-link audit, 2026-07-30).
//
// Rewrites href="https://(www.)sosmovingla.net{old}[/]" -> href="{new}"
// across public/pages/*.html. Run once: node scripts/fix-abs-links.mjs
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Longer/more specific paths must come first.
const MAP = new Map([
  // mangled external links
  ["/blog/5-quick-ways-to-check-if-moving-company-is-legitimate/movingscam.com", "https://www.movingscam.com/"],
  ["/forms-pubs/about-form-3903", "https://www.irs.gov/forms-pubs/about-form-3903"],
  // blog post with a typo'd slug (missing "a")
  ["/blog/5-quick-ways-to-check-if-moving-company-is-legitimate", "/blog/5-quick-ways-to-check-if-a-moving-company-is-legitimate"],
  // old service slugs -> current services
  ["/services/interstate-move/california-to-colorado", "/services/long-distance-movers"],
  ["/services/interstate-move/california-to-florida", "/services/long-distance-movers"],
  ["/services/interstate-move/california-to-new-york", "/services/long-distance-movers"],
  ["/services/interstate-move", "/services/long-distance-movers"],
  ["/services/long-distance-move", "/services/long-distance-movers"],
  ["/services/commercial-move", "/services/commercial-movers"],
  ["/services/apartment-move", "/services/apartment-movers"],
  ["/services/residential-move", "/services/local-moving"],
  ["/services/local-move", "/services/local-moving"],
  ["/services/furniture-move", "/services/white-glove-movers"],
  ["/services/piano-move", "/services/white-glove-movers"],
  ["/services/appliance-move", "/services"],
  ["/services/labor-only-services", "/services"],
  // cities that no longer exist / moved
  ["/los-angeles-movers/santa-clarita-movers", "/santa-clarita-movers"],
  ["/los-angeles-movers/lancaster-movers", "/los-angeles-movers"],
  ["/downtown-los-angeles-movers", "/movers-downtown-los-angeles"],
  ["/lancaster-movers", "/los-angeles-movers"],
  ["/palmdale-movers", "/los-angeles-movers"],
  ["/westwood-movers", "/west-los-angeles-movers"],
  ["/los-angeles-county-movers", "/los-angeles-movers"],
  ["/san-bernardino-movers", "/los-angeles-movers"],
  // old flat blog slugs -> /blog/{slug} (every target file exists)
  ...[
    "10-questions-to-ask-your-local-la-movers-before-hiring-them",
    "diy-moving-mistakes-you-should-avoid",
    "guide-for-rating-your-la-movers",
    "homebuyers-guide-to-ca-real-estate-market",
    "how-hiring-movers-can-help-you-be-more-environmentally-friendly-in-ca",
    "how-to-cut-moving-expenses-for-your-california-move",
    "how-to-make-moving-with-kids-easy",
    "how-to-meet-your-neighbors-after-moving-to-nyc-from-ca",
    "how-to-pack-fragile-items",
    "how-to-speed-up-your-california-move",
    "how-to-unpack-in-a-day-after-moving-from-ca-to-nyc",
    "leftover-moving-boxes-after-the-relocation",
    "moving-house-the-day-after-the-move-to-la",
    "moving-tips-and-tricks",
    "post-move-relaxation-ideas-you-should-explore",
    "pre-move-measuring-checklist",
    "reasons-to-hire-professional-packers",
    "reasons-why-foreigners-enjoy-la-so-much",
    "should-you-get-involved-in-the-moving-process-when-you-hire-movers-in-la",
    "simple-decorating-tips-to-try-once-you-relocate-in-la",
    "step-by-step-commercial-relocation-checklist",
    "the-risks-of-hiring-amateur-ca-movers",
    "the-ultimate-guide-for-a-successful-moving-day",
    "the-ultimate-list-of-moving-supplies-for-an-la-move",
    "things-that-make-your-california-move-expensive",
    "tips-for-living-in-smaller-spaces",
    "tips-on-moving-in-the-off-peak-season",
    "what-to-do-when-you-lack-time-to-unpack",
    "what-to-know-when-you-are-selecting-a-moving-company",
  ].map((s) => [`/${s}`, `/blog/${s}`]),
]);

const dir = "public/pages";
let filesTouched = 0;
let total = 0;
for (const f of readdirSync(dir).filter((f) => f.endsWith(".html"))) {
  const p = join(dir, f);
  let html = readFileSync(p, "utf-8");
  let n = 0;
  for (const [oldPath, dest] of MAP) {
    for (const host of ["https://sosmovingla.net", "https://www.sosmovingla.net"]) {
      for (const suffix of ["/", ""]) {
        const needle = `href="${host}${oldPath}${suffix}"`;
        if (html.includes(needle)) {
          n += html.split(needle).length - 1;
          html = html.split(needle).join(`href="${dest}"`);
        }
      }
    }
  }
  if (n > 0) {
    writeFileSync(p, html, "utf-8");
    filesTouched++;
    total += n;
  }
}
console.log(`fixed ${total} links in ${filesTouched} files`);
