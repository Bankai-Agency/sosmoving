import { renderPage } from '@/lib/render-page';
import { metaForPath } from '@/lib/seo-meta';

export const metadata = metaForPath('/book-online');

export default function Page() {
  return renderPage('book-online');
}
