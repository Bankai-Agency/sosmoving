import type { Metadata } from 'next';
import { renderPage } from '@/lib/render-page';
import { metaForPath } from '@/lib/seo-meta';

export const metadata: Metadata = metaForPath('/about-us/apartment-partnership', {
  description:
    'Partner with SOS Moving for apartment communities — discounted rates for residents, damage prevention, COI handling, and dedicated move coordination.',
});

export default function Page() {
  return renderPage('about-us__apartment-partnership');
}
