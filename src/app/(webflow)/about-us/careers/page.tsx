import type { Metadata } from 'next';
import { renderPage } from '@/lib/render-page';
import { metaForPath } from '@/lib/seo-meta';

export const metadata: Metadata = metaForPath('/about-us/careers', {
  description:
    'Join the SOS Moving team in Los Angeles. Open positions: Accounting Specialist and Foreman Driver. Licensed, insured, 4.9★ rated moving company.',
});

export default function Page() {
  return renderPage('about-us__careers');
}
