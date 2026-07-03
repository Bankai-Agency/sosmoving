import type { Metadata } from 'next';
import { renderPage } from '@/lib/render-page';
import { metaForPath, JsonLd } from '@/lib/seo-meta';

export const metadata: Metadata = metaForPath('/about-us', {
  description:
    'Learn about SOS Moving Company, a professional, licensed, and insured moving company founded in Los Angeles in 2019 and expanded to San Francisco in 2021.',
});

export default function Page() {
  return (
    <>
      <JsonLd path="/about-us" />
      {renderPage('about-us')}
    </>
  );
}
