import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // Public marketing pages should be indexable.
  // App-like pages (/scan, /scans, /login) should not.
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/impressum", "/datenschutz", "/muster-report"],
        disallow: ["/scan", "/scans", "/login"],
      },
    ],
    sitemap: "https://bfsg.vercel.app/sitemap.xml",
    host: "https://bfsg.vercel.app",
  };
}
