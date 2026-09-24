import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Ad landing copies (/ads/<city>-movers) - noindex,nofollow on the
      // pages themselves as well. AdsBot-Google ignores the `*` group by
      // design, so campaign landing pages are still crawled for ad review.
      // `_page=` - Webflow-era list pagination (?e0b30627_page=2 and the
      // like): every combination renders the same /blog. Our own pager uses
      // ?page=N, which this pattern does not match.
      disallow: ['/ads/', '/*_page='],
    },
    sitemap: 'https://www.sosmovingla.net/sitemap.xml',
  };
}
