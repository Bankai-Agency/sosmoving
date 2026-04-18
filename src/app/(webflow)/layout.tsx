import type { Metadata } from "next";
import "./globals.css";
import ScriptLoader from "@/components/ScriptLoader";
import { SharedHtmlBlock } from "@/components/shared/SharedHtmlBlock";

export const metadata: Metadata = {
  title: {
    default: "Los Angeles Moving Company from $119/hr | 4.9\u2605 \u2014 SOS Moving & Storage",
    template: "%s | SOS Moving & Storage",
  },
  description:
    "SOS Moving \u2014 4.9\u2605 rated LA moving company. Local & long-distance moves from $119/hr. Free blankets, shrink wrap & wardrobe boxes included.",
  metadataBase: new URL("https://www.sosmovingla.net"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="w-mod-js" data-wf-site="645ab1d97922876b775bef4f">
      <head>
        {/* Preload critical same-origin scripts so browser fetches them
            in parallel with HTML parsing, instead of waiting for ScriptLoader
            to kick in after React hydration. Cuts ~500-800ms off time-to-jQuery
            on slow mobile networks. Must match exact hrefs in ScriptLoader.tsx. */}
        <link rel="preload" as="script" href="/webflow.schunk.f2efb3c5440a81cf.js" />
        <link rel="preload" as="script" href="/webflow.schunk.81d31091c363b462.js" />

        {/* External scripts: preconnect opens TCP+TLS in advance, preload queues
            the fetch. NOTE: no crossOrigin here — ScriptLoader creates <script>
            tags without crossorigin attr, so credentials modes must match
            (both "include" by default). If crossOrigin="anonymous" is added
            here without matching the script tag, browser fetches jQuery twice. */}
        <link rel="preconnect" href="https://code.jquery.com" />
        <link rel="preload" as="script" href="https://code.jquery.com/jquery-3.5.1.min.js" />

        {/* dns-prefetch is cheaper than preconnect — use for origins loaded
            later in the critical chain (GSAP, jQuery plugins, Chatbase). */}
        <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />

        {/* Vidzflow video (hero background on / and /about-us/video-reviews).
            Iframe is server-swapped to a facade in page-sections.ts and lazy-
            mounted by custom-scripts.js after FCP. Preconnect cuts ~220ms off
            the handshake when the iframe finally loads. */}
        <link rel="dns-prefetch" href="https://app.vidzflow.com" />
        <link rel="dns-prefetch" href="https://r2.vidzflow.com" />

        <link href="/webflow.css" rel="stylesheet" type="text/css" />
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link href="https://fonts.gstatic.com" rel="preconnect" crossOrigin="anonymous" />
        {/* Lato: reduced from 10 variants to 3 (400, 400italic, 700).
            Previously webflow.css called font-weight 500/600/800 which weren't
            loaded anyway — browser was already falling back to 400/700.
            Only site-wide impact: font-weight:300 in .w-lightbox-backdrop (Webflow
            lightbox overlay) now renders as 400. Saves ~250KB on initial load. */}
        <link href="https://fonts.googleapis.com/css?family=Lato:400,400italic,700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <SharedHtmlBlock name="exit-popup" />
        <SharedHtmlBlock name="navbar" />
        {children}
        <SharedHtmlBlock name="footer" />
        <ScriptLoader />
      </body>
    </html>
  );
}
