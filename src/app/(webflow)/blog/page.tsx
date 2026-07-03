import { renderPage } from '@/lib/render-page';
import { metaForPath } from '@/lib/seo-meta';

export const metadata = metaForPath('/blog');
export default function Page() { return renderPage('blog'); }
