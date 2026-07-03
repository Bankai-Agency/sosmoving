import { renderPage } from '@/lib/render-page';
import { metaForPath } from '@/lib/seo-meta';

export const metadata = metaForPath('/moving-services');

export default function Page() {
  return renderPage('moving-services');
}
