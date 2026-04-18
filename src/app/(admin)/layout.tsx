import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/admin/ThemeProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Admin — SOS Moving",
    template: "%s · Admin — SOS Moving",
  },
  description: "Content & site operations admin panel",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /*
     * `suppressHydrationWarning` is required by next-themes: the server
     * renders with defaultTheme, the client may pick a different theme
     * from localStorage on first paint — React would otherwise log a
     * hydration mismatch on <html>.
     *
     * `className="dark"` is the initial server render (matches defaultTheme
     * in ThemeProvider); next-themes replaces the class at hydration if
     * the stored preference differs.
     */
    <html
      lang="ru"
      data-admin="true"
      className={`${inter.variable} dark`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
