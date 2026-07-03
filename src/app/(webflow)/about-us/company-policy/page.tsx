import type { Metadata } from 'next';
import { renderPage } from '@/lib/render-page';
import { metaForPath } from '@/lib/seo-meta';

export const metadata: Metadata = metaForPath('/about-us/company-policy', {
  description:
    'SOS Moving & Storage company policy — liability limits, payment terms, service requirements, insurance coverage, and dispute resolution. Read before booking.',
});

export default function Page() {
  return renderPage('about-us__company-policy');
}
