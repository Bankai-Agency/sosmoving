import type { Metadata } from 'next';
import { renderPage } from '@/lib/render-page';
import { metaForPath } from '@/lib/seo-meta';

// New page (not part of the pre-migration etalon) — metaForPath only
// supplies the canonical; title/description/OG are authored here.
const TITLE = 'Terms and Conditions | SOS Moving & Storage';
const DESCRIPTION =
  'Terms and conditions for using the SOS Moving & Storage website and booking our services — estimates, communications consent (calls, e-mail, SMS), and dispute resolution.';

export const metadata: Metadata = metaForPath('/about-us/terms-and-conditions', {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/about-us/terms-and-conditions',
    type: 'website',
  },
});

export default function Page() {
  return renderPage('about-us__terms-and-conditions');
}
