import { renderPage } from '@/lib/render-page';
import { metaForPath } from '@/lib/seo-meta';

export const metadata = metaForPath('/free-estimate');
export default function Page() { return renderPage('free-estimate'); }
