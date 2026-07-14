import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import ScriptLoader from "@/components/ScriptLoader";
import { SharedHtmlBlock } from "@/components/shared/SharedHtmlBlock";

// Typography comes from webflow.css: the live-site redesign moved the
// whole shared stylesheet to Manrope (@font-face → /fonts/*.woff2,
// self-hosted). The earlier Inter force-override ("redesign step 1") was
// removed for cutover parity — the clone must render exactly like
// www.sosmovingla.net.

export const metadata: Metadata = {
  title: {
    default: "Los Angeles Moving Company from $119/hr | 4.9\u2605 \u2014 SOS Moving & Storage",
    template: "%s | SOS Moving & Storage",
  },
  description:
    "SOS Moving \u2014 4.9\u2605 rated LA moving company. Local & long-distance moves from $119/hr. Free blankets, shrink wrap & wardrobe boxes included.",
  metadataBase: new URL("https://www.sosmovingla.net"),
  verification: {
    google: "6mIWXOA5HThwKZik5GESXAvERIKj8EXjIuaYNQXKna0",
  },
  // Same icon assets the old Webflow site served, self-hosted
  // (src/app/favicon.ico additionally covers the bare /favicon.ico request).
  icons: {
    icon: { url: "/favicon.svg", type: "image/svg+xml" },
    apple: "/apple-touch-icon.svg",
  },
};

// Google Tag Manager container (GA4 is wired inside it). Same container the
// old Webflow site used — keeps analytics history continuous across the
// migration. Form-submit events must reach dataLayer (verified in GTM debug).
const GTM_ID = "GTM-5QSS53C9";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="w-mod-js"
      data-wf-site="645ab1d97922876b775bef4f"
    >
      <head>
        {/* Preload critical same-origin scripts so browser fetches them
            in parallel with HTML parsing, instead of waiting for ScriptLoader
            to kick in after React hydration. Cuts ~500-800ms off time-to-jQuery
            on slow mobile networks. Must match exact hrefs in ScriptLoader.tsx. */}
        <link rel="preload" as="script" href="/webflow.schunk.f2efb3c5440a81cf.js" />
        <link rel="preload" as="script" href="/webflow.schunk.b2a9fed12100bec1.js" />

        {/* jQuery is self-hosted in /vendor (like every third-party lib —
            ad-blockers routinely kill cdnjs/jsdelivr requests). */}
        <link rel="preload" as="script" href="/vendor/jquery-3.5.1.min.js" />

        {/* Vidzflow video (hero background on / and /about-us/video-reviews).
            Iframe is server-swapped to a facade in page-sections.ts and lazy-
            mounted by custom-scripts.js after FCP. Preconnect cuts ~220ms off
            the handshake when the iframe finally loads. */}
        <link rel="dns-prefetch" href="https://app.vidzflow.com" />
        <link rel="dns-prefetch" href="https://r2.vidzflow.com" />

        <link href="/webflow.css" rel="stylesheet" type="text/css" />

        {/* Manrope (self-hosted, /fonts/) — preload the two weights used
            above the fold so text renders without a swap flash. */}
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/fonts/Manrope-Regular.woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/fonts/Manrope-Bold.woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
        <SharedHtmlBlock name="exit-popup" />
        <SharedHtmlBlock name="navbar" />
        {children}
        <SharedHtmlBlock name="footer" />
        <ScriptLoader />
      </body>
    </html>
  );
}
