import { renderPage } from '@/lib/render-page';
import { metaForPath, JsonLd } from '@/lib/seo-meta';

export const metadata = metaForPath('/about-us/reviews');
export default function Page() { return (
    <>
      <JsonLd path="/about-us/reviews" />
      {renderPage('about-us__reviews')}
    </>
  ); }
