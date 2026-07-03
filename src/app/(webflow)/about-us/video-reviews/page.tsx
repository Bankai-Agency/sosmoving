import { renderPage } from '@/lib/render-page';
import { metaForPath, JsonLd } from '@/lib/seo-meta';

export const metadata = metaForPath('/about-us/video-reviews');

export default function Page() {
  return (
    <>
      <JsonLd path="/about-us/video-reviews" />
      {renderPage('about-us__video-reviews')}
    </>
  );
}
