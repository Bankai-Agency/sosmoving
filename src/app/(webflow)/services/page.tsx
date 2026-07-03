import type { Metadata } from 'next';
import { renderPage } from '@/lib/render-page';
import { metaForPath, JsonLd } from '@/lib/seo-meta';

export const metadata: Metadata = metaForPath('/services', {
  description:
    'SOS Moving services in Los Angeles — apartment, commercial, long-distance, packing, white glove, and storage. Licensed & insured. From $119/hr.',
});

export default function Page() {
  return (
    <>
      <JsonLd path="/services" />
      {renderPage('services')}
    </>
  );
}
