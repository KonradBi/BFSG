import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import Link from "next/link";
import type { Metadata } from "next";
import { markdownToHtml } from "@/app/lib/markdown";

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
    <main className="min-h-screen bg-background text-foreground hero-gradient selection:bg-blue-500/30 px-4 md:px-6 py-16">
      <article className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-bold text-blue-700 hover:text-blue-800">
            ← Zur Startseite
          </Link>
          <Link href="/ratgeber" className="text-sm font-bold text-slate-700 hover:text-blue-700">
            Ratgeber
          </Link>
        </div>

        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
          {String(data.title || "BFSG 2025")}
        </h1>

        <div className="prose prose-slate max-w-none mt-8">
          {/* eslint-disable-next-line react/no-danger */}
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>

        <div className="mt-12 rounded-3xl border border-blue-100 bg-blue-50 p-6">
          <div className="font-extrabold text-slate-900">Direkt prüfen</div>
          <div className="mt-1 text-slate-700">
            Nutzen Sie den Kurz‑Check und erhalten Sie sofort technische Hinweise (kein Rechtsrat).
          </div>
          <Link href="/" className="mt-4 inline-flex rounded-xl bg-blue-600 text-white px-5 py-3 font-black">
            BFSG Check starten
          </Link>
        </div>
      </article>
    </main>
  );
}
