import { renderPage } from '@/lib/render-page';
import { metaForPath, JsonLd } from '@/lib/seo-meta';

export const metadata = metaForPath('/about-us/meet-our-team');
export default function Page() { return (
    <>
      <JsonLd path="/about-us/meet-our-team" />
      {renderPage('about-us__meet-our-team')}
    </>
  ); }
