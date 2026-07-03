import { renderPage } from '@/lib/render-page';
import { metaForPath } from '@/lib/seo-meta';

export const metadata = metaForPath('/confirmation-page-refer-friends-get-cash');

export default function Page() {
  return renderPage('confirmation-page-refer-friends-get-cash');
}
