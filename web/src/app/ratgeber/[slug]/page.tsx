import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import Link from "next/link";
import type { Metadata } from "next";
import { markdownToHtml } from "@/app/lib/markdown";

function postDir() {
  return path.join(process.cwd(), "content/ratgeber");
}

function getAllSlugs() {
  return fs
    .readdirSync(postDir())
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

function getPostBySlug(slug: string) {
  const fullPath = path.join(postDir(), `${slug}.md`);
  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  return {
    slug: String(data.slug || slug),
    title: String(data.title || slug),
    metaTitle: data.metaTitle ? String(data.metaTitle) : undefined,
    metaDescription: data.metaDescription ? String(data.metaDescription) : undefined,
    content,
  };
}

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  const title = post.metaTitle || post.title;
  const description =
    post.metaDescription ||
    "Ratgeberartikel zu BFSG 2025, Barrierefreiheit, WCAG und BITV. Keine Rechtsberatung.";

  return {
    title,
    description,
    alternates: { canonical: `/ratgeber/${post.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://bfsg.vercel.app/ratgeber/${post.slug}`,
    },
  };
}

export default async function RatgeberPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  const html = await markdownToHtml(post.content);

  return (
    <main className="min-h-screen bg-background text-foreground hero-gradient selection:bg-blue-500/30 px-4 md:px-6 py-16">
      <article className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/ratgeber" className="text-sm font-bold text-blue-700 hover:text-blue-800">
            ← Zur Ratgeber-Übersicht
          </Link>
        </div>

        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
          {post.title}
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
