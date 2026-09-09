import { renderPage } from '@/lib/render-page';
import { metaForPath, JsonLd } from '@/lib/seo-meta';

export const metadata = metaForPath('/');

export default function HomePage() {
  return (
    <>
      <JsonLd path="/" />
      {renderPage('index')}
    </>
  );
}
