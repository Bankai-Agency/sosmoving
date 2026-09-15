import "@/app/(webflow)/globals.css";
import { SiteShell, siteMetadata } from "@/components/shared/SiteShell";

export const metadata = siteMetadata;

/**
 * Root layout of the ad landing copies (/ads/*): the same site chrome as
 * (webflow), but the footer comes without the links to every city page. The
 * copies are kept out of the site graph, so those links are not rendered here
 * at all rather than hidden.
 */
export default function AdsRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SiteShell footerAreas={false}>{children}</SiteShell>;
}
