import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Ad landing copies (/ads/<city>-movers) - noindex,nofollow on the
      // pages themselves as well. AdsBot-Google ignores the `*` group by
      // design, so campaign landing pages are still crawled for ad review.
      disallow: '/ads/',
    },
    sitemap: 'https://www.sosmovingla.net/sitemap.xml',
  };
}
