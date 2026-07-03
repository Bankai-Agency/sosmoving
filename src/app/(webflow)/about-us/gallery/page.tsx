import type { Metadata } from 'next';
import { renderPage } from '@/lib/render-page';
import { metaForPath } from '@/lib/seo-meta';

export const metadata: Metadata = metaForPath('/about-us/gallery', {
  description:
    'SOS Moving & Storage photo and video gallery — see our fleet, professional crews, and commercial spots featuring top LA influencers.',
});

export default function Page() {
  return renderPage('about-us__gallery');
}
