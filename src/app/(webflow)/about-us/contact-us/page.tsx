import { renderPage } from '@/lib/render-page';
import { metaForPath, JsonLd } from '@/lib/seo-meta';

export const metadata = metaForPath('/about-us/contact-us');
export default function Page() { return (
    <>
      <JsonLd path="/about-us/contact-us" />
      {renderPage('about-us__contact-us')}
    </>
  ); }
