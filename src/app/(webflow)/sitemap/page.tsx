import { renderPage } from '@/lib/render-page';
import { metaForPath } from '@/lib/seo-meta';

export const metadata = metaForPath('/sitemap');

// Human-readable sitemap HTML at /sitemap.
// Note: machine-readable sitemap.xml is generated separately by sitemap.ts.
export default function Page() {
  return renderPage('sitemap');
}
