import "@/app/(webflow)/globals.css";
import { SiteShell, siteMetadata } from "@/components/shared/SiteShell";

export const metadata = siteMetadata;

/**
 * Root layout of the ad landing copies (/ads/*): the same site chrome as
 * (webflow) in its "ads" variant - a header reduced to the logo, the phone
 * and the quote button, no exit popup, no chat widget - and the footer
 * without the links to every city page. The copies are kept out of the site
 * graph, so those links are not rendered here at all rather than hidden.
 */
export default function AdsRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Header and footer are rendered by the page (see ads/[slug]/page.tsx):
  // the v2 landing carries its own footer and a header button that scrolls
  // to its form, the other copies get the shared chrome there.
  return (
    <SiteShell variant="ads" chrome={false}>
      {children}
    </SiteShell>
  );
}
