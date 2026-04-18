import type { Metadata } from "next";
import "@/app/(webflow)/globals.css";
import ScriptLoader from "@/components/ScriptLoader";
import { SharedHtmlBlock } from "@/components/shared/SharedHtmlBlock";

/**
 * Preview layout — same visual chrome as the public site (webflow.css,
 * navbar, footer, exit-popup, ScriptLoader) so the article inside
 * /preview/blog/[slug] looks 1:1 with how it will render once published.
 *
 * Isolated route group: `(preview)` keeps its own <html>/<body> separate
 * from `(webflow)` (which uses a bunch of Webflow data-attrs tied to the
 * production routes) and from `(admin)` (which runs Tailwind shadcn tokens).
 *
 * Access control lives in src/proxy.ts — unauthenticated requests to
 * /preview/* get a 302 to /admin/login. That's why this route is fine to
 * expose the raw article body: only authenticated editors can reach it.
 */

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Preview — SOS Moving",
};

export default function PreviewRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="w-mod-js" data-wf-site="645ab1d97922876b775bef4f">
      <head>
        {/* Same chrome as (webflow)/layout.tsx — a raw <link> to webflow.css
            and Lato webfont. next/link is no good here (stylesheet, not nav)
            and moving to next/font would fork a separate font pipeline just
            for preview. Suppressing the lint that flags both. */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link href="/webflow.css" rel="stylesheet" type="text/css" />
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link href="https://fonts.gstatic.com" rel="preconnect" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css?family=Lato:400,400italic,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* A slim banner stuck to the top so editors don't confuse this with the live site. */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 9999,
            width: "100%",
            background: "#FFE533",
            color: "#151414",
            padding: "8px 16px",
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            textAlign: "center",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          Превью — только редакторам. Контент ещё НЕ на сайте.{" "}
          <a href="javascript:history.back()" style={{ textDecoration: "underline", marginLeft: "8px" }}>
            ← Назад в редактор
          </a>
        </div>
        <SharedHtmlBlock name="exit-popup" />
        <SharedHtmlBlock name="navbar" />
        {children}
        <SharedHtmlBlock name="footer" />
        <ScriptLoader />
      </body>
    </html>
  );
}
