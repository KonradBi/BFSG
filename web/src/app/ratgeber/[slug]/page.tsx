import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import Link from "next/link";
import type { Metadata } from "next";
import { markdownToHtml } from "@/app/lib/markdown";
import { RELATED_POSTS } from "@/app/lib/relatedPosts";

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
    ogImage: data.ogImage ? String(data.ogImage) : undefined,
    content,
  };
}

function tryLoadTitle(slug: string): string {
  try {
    const p = getPostBySlug(slug);
    return p.title;
  } catch {
    return slug;
  }
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

  const ogImage = (post as any).ogImage as string | undefined;

  return {
    title,
    description,
    alternates: { canonical: `/ratgeber/${post.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://bfsg.vercel.app/ratgeber/${post.slug}`,
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

export default async function RatgeberPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  const html = await markdownToHtml(post.content);

  const related = (RELATED_POSTS[post.slug] || []).slice(0, 3);

  return (
    <main className="min-h-screen bg-background text-foreground hero-gradient selection:bg-blue-500/30 px-4 md:px-6 py-16">
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
          {post.title}
        </h1>

        <div className="prose prose-slate max-w-none mt-8">
          {/* eslint-disable-next-line react/no-danger */}
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>

        {related.length > 0 && (
          <div className="mt-12 rounded-3xl border border-slate-200 bg-white p-6">
            <div className="font-extrabold text-slate-900">Weiterführende Artikel</div>
            <div className="mt-4 grid gap-3">
              {related.map((slug) => (
                <Link
                  key={slug}
                  href={`/ratgeber/${slug}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-900 hover:bg-slate-100"
                >
                  {tryLoadTitle(slug)}
                </Link>
              ))}
            </div>
          </div>
        )}

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
