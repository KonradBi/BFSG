import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import Link from "next/link";
import type { Metadata } from "next";
import { markdownToHtml } from "@/app/lib/markdown";
import SiteNav from "../../components/SiteNav";
import SiteFooter from "../../components/SiteFooter";

export const metadata: Metadata = {
  title: "BFSG FAQ: 60 Fragen & Antworten",
  description:
    "Die wichtigsten Fragen rund um BFSG 2025, Barrierefreiheit, WCAG, BITV und EN 301 549 – verständlich beantwortet (keine Rechtsberatung).",
  alternates: { canonical: "/ratgeber/faq" },
  openGraph: {
    title: "BFSG FAQ: 60 Fragen & Antworten",
    description:
      "Die wichtigsten Fragen rund um BFSG 2025, Barrierefreiheit, WCAG, BITV und EN 301 549 – verständlich beantwortet (keine Rechtsberatung).",
    type: "article",
    url: "https://bfsg.vercel.app/ratgeber/faq",
  },
};

export default async function FaqPage() {
  const fullPath = path.join(process.cwd(), "content/ratgeber/faq-bfsg.md");
  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  const html = await markdownToHtml(content);

  return (
    <main className="min-h-screen bg-background text-foreground hero-gradient selection:bg-blue-500/30 pt-24 pb-20 px-4 md:px-6">
      <SiteNav backHref="/ratgeber" backLabel="Ratgeber" />
      <article className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link href="/ratgeber" className="text-sm font-bold text-blue-700 hover:text-blue-800">
            ← Zur Ratgeber-Übersicht
          </Link>
          <Link href="/" className="text-sm font-black text-slate-900 hover:text-blue-700">
            BFSG Check starten
          </Link>
        </div>

        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
          {String(data.title || "BFSG FAQ")}
        </h1>

        <div className="prose prose-slate max-w-none mt-8">
          {/* eslint-disable-next-line react/no-danger */}
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>

        <SiteFooter note="" />

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
