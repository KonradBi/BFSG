import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

const SITE = {
  name: "BFSG‑WebCheck",
  url: "https://bfsg.vercel.app",
  description:
    "BFSG Check: Barrierefreiheit Ihrer Website prüfen – technische Analyse nach WCAG/BITV/EN 301 549 mit klaren Befunden & Fix‑Schritten. Keine Rechtsberatung.",
} as const;

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "BFSG Check: Website-Barrierefreiheit prüfen | BFSG‑WebCheck",
    template: "%s | BFSG‑WebCheck",
  },
  description: SITE.description,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: SITE.url,
    title: "BFSG Check: Website-Barrierefreiheit prüfen (BFSG 2025)",
    description: SITE.description,
    siteName: SITE.name,
    locale: "de_DE",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "BFSG‑WebCheck",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BFSG Check: Website-Barrierefreiheit prüfen (BFSG 2025)",
    description: SITE.description,
    images: ["/og.png"],
  },
  manifest: "/site.webmanifest",
  other: {
    "theme-color": "#1e3a8a",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Lightweight JSON-LD for better understanding by search engines.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: SITE.name,
        url: SITE.url,
        logo: `${SITE.url}/brand/logo.png`,
      },
      {
        "@type": "WebSite",
        name: SITE.name,
        url: SITE.url,
      },
      {
        "@type": "WebPage",
        name: "BFSG Check: Website-Barrierefreiheit prüfen | BFSG‑WebCheck",
        url: SITE.url,
        description: SITE.description,
      },
    ],
  };

  return (
    <html lang="de" className="scroll-smooth" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
