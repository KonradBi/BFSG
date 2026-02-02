import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import Link from "next/link";
import type { Metadata } from "next";
import { markdownToHtml } from "@/app/lib/markdown";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";

function getDoc() {
  const fullPath = path.join(process.cwd(), "content/cornerstones/bfsg-2025.md");
  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  return { data: data as any, content };
}

export async function generateMetadata(): Promise<Metadata> {
  const { data } = getDoc();
  const title = String(data.metaTitle || data.title || "BFSG 2025 Guide");
  const description = String(
    data.metaDescription ||
      "BFSG 2025 verständlich erklärt: Anforderungen, Fristen und Checkliste für Websites und Onlineshops."
  );
  const ogImage = data.ogImage ? String(data.ogImage) : undefined;

  return {
    title,
    description,
    alternates: { canonical: "/bfsg-2025" },
    openGraph: {
      title,
      description,
      type: "article",
      url: "https://bfsg.vercel.app/bfsg-2025",
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function Bfsg2025Page() {
  const { data, content } = getDoc();
  const html = await markdownToHtml(content);

  return (
    <main className="min-h-screen bg-background text-foreground hero-gradient selection:bg-blue-500/30 pt-24 pb-20 px-4 md:px-6">
      <SiteNav />

      <article className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link href="/ratgeber" className="text-sm font-bold text-slate-700 hover:text-blue-700">
            ← Ratgeber
          </Link>
          <Link href="/scan" className="text-sm font-bold text-blue-700 hover:text-blue-800">
            Kurz‑Check starten
          </Link>
        </div>

        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
          {String(data.title || "BFSG 2025")}
        </h1>

        {data.subtitle && (
          <p className="mt-4 text-lg text-slate-700 leading-relaxed">{String(data.subtitle)}</p>
        )}

        <div
          className="prose prose-slate max-w-none mt-10"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <div className="mt-12 rounded-3xl border border-blue-100 bg-blue-50 p-6">
          <div className="font-extrabold text-slate-900">Nächster Schritt</div>
          <div className="mt-1 text-slate-700">
            Starten Sie einen Kurz‑Check und sehen Sie sofort, ob sich ein Audit lohnt.
          </div>
          <Link
            href="/"
            className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700"
          >
            Zum Scan
          </Link>
        </div>

        <SiteFooter note="" />
      </article>
    </main>
  );
}
