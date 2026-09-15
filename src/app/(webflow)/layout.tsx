import "./globals.css";
import { SiteShell, siteMetadata } from "@/components/shared/SiteShell";

export const metadata = siteMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SiteShell>{children}</SiteShell>;
}
