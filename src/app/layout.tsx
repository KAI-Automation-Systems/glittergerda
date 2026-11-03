import type { Metadata } from "next";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "GlitterGerda — Maak je eigen glitterplaatje",
    template: "%s | GlitterGerda",
  },
  description: "Maak binnen 30 seconden een echte bewegende glitter-GIF.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "GlitterGerda — Maak je eigen glitterplaatje",
    description: "Echte bewegende glitter. Geen prompts, geen gedoe.",
    type: "website",
    locale: "nl_NL",
    siteName: "GlitterGerda",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
