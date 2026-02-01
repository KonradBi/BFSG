import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bfsg.vercel.app"),
  title: "BFSG-WebCheck | Barrierefreiheits-Checks & Audit-Reports",
  description:
    "Technische Barrierefreiheits-Checks (WCAG/BITV/EN 301 549) mit klaren Befunden und Fix-Schritten. Kein Rechtsrat.",
  openGraph: {
    type: "website",
    title: "BFSG-WebCheck",
    description:
      "Technische Barrierefreiheits-Checks (WCAG/BITV/EN 301 549) mit klaren Befunden und Fix-Schritten.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "BFSG-WebCheck",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BFSG-WebCheck",
    description:
      "Technische Barrierefreiheits-Checks (WCAG/BITV/EN 301 549) mit klaren Befunden und Fix-Schritten.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
