import { renderPage } from '@/lib/render-page';
import { metaForPath } from '@/lib/seo-meta';

// Thank-you page every form redirects to after submit. Not in the old
// sitemap (kept out of ours too), title mirrors the old page.
export const metadata = metaForPath('/confirmation-page', {
  title: { absolute: 'Thank You | SOS Moving' },
});

export default function Page() {
  return renderPage('confirmation-page');
}
