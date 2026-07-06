import { renderPage } from '@/lib/render-page';
import { metaForPath, JsonLd } from '@/lib/seo-meta';

export const metadata = metaForPath('/');

export default function HomePage() {
  return (
    <>
      <JsonLd path="/" />
      {/* Homepage-specific Webflow main bundle (plus 2 extra chunks it needs).
          Layout.tsx preloads jQuery + common chunks; this preloads the rest so
          the whole Webflow script chain is fetched in parallel with HTML parse
          instead of serially after hydration. See wf-bundle-map.json. */}
      <link rel="preload" as="script" href="/webflow.987c289e.df925483dbcdb1a9.js" />
      <link rel="preload" as="script" href="/webflow.schunk.f919141e3448519b.js" />
      {renderPage('index')}
    </>
  );
}
