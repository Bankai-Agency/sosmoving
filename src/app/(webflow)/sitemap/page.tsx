import { renderPage } from '@/lib/render-page';

// Human-readable sitemap HTML at /sitemap.
// Note: machine-readable sitemap.xml is generated separately by sitemap.ts.
export default function Page() {
  return renderPage('sitemap');
}
