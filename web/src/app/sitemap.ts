import type { MetadataRoute } from "next";
import { listRatgeberSlugs } from "@/app/lib/sitemapPosts";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://bfsg.vercel.app";
  const now = new Date();

  const staticRoutes: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" },
    { path: "/ratgeber", priority: 0.8, changeFrequency: "weekly" },
    { path: "/ratgeber/faq", priority: 0.7, changeFrequency: "monthly" },
    { path: "/bfsg-2025", priority: 0.9, changeFrequency: "weekly" },
    { path: "/audit-kosten", priority: 0.7, changeFrequency: "monthly" },
    { path: "/pricing", priority: 0.5, changeFrequency: "monthly" },
    { path: "/muster-report", priority: 0.6, changeFrequency: "monthly" },
    { path: "/impressum", priority: 0.2, changeFrequency: "yearly" },
    { path: "/datenschutz", priority: 0.2, changeFrequency: "yearly" },
  ];

  const ratgeberRoutes = listRatgeberSlugs().map((slug) => ({
    url: `${base}/ratgeber/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.55,
  }));

  return [
    ...staticRoutes.map((r) => ({
      url: `${base}${r.path}`,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...ratgeberRoutes,
  ];
}
