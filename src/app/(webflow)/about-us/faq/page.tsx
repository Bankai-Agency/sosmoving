import { renderPage } from '@/lib/render-page';
import { metaForPath, JsonLd } from '@/lib/seo-meta';

export const metadata = metaForPath('/about-us/faq');
export default function Page() { return (
    <>
      <JsonLd path="/about-us/faq" />
      {renderPage('about-us__faq')}
    </>
  ); }
