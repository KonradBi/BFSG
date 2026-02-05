import Link from "next/link";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";

type Post = {
  slug: string;
  title: string;
  description?: string;
  descriptionTruncated?: boolean;
  ogImage?: string;
  ogImageAlt?: string;
};

const MIN_EXCERPT_LENGTH = 160;
const MAX_EXCERPT_LENGTH = 200;

function createExcerpt(markdown: string) {
  let text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#+\s+/gm, "")
    .replace(/^\s{0,3}(?:[-*+]\s+|\d+\.\s+)/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[*_~]+/g, "")
    .replace(/\|/g, " ")
    .replace(/-{3,}/g, " ")
    .replace(/[•·]+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= MAX_EXCERPT_LENGTH) {
    return { text, truncated: false };
  }

  const slice = text.slice(0, MAX_EXCERPT_LENGTH + 1);
  let cutIndex = slice.lastIndexOf(" ", MAX_EXCERPT_LENGTH);
  if (cutIndex < MIN_EXCERPT_LENGTH) {
    cutIndex = MAX_EXCERPT_LENGTH;
  }

  return { text: text.slice(0, cutIndex).trim(), truncated: true };
}

function getPosts(): Post[] {
  const dir = path.join(process.cwd(), "content/ratgeber");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const { data, content } = matter(raw);
      const title = String(data.title || file.replace(/\.md$/, ""));
      const slug = String(data.slug || file.replace(/\.md$/, ""));
      const { text: excerpt, truncated } = createExcerpt(content);
      const ogImage = data.ogImage ? String(data.ogImage) : undefined;
      const ogImageAlt = data.ogImageAlt ? String(data.ogImageAlt) : undefined;
      return {
        slug,
        title,
        description: excerpt,
        descriptionTruncated: truncated,
        ogImage,
        ogImageAlt,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export default function RatgeberIndex() {
  const posts = getPosts();

  return (
    <main className="min-h-screen bg-background text-foreground hero-gradient selection:bg-blue-500/30 pt-24 pb-20 px-4 md:px-6">
      <SiteNav />

      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">Ratgeber: BFSG & Barrierefreiheit</h1>
        <p className="mt-4 text-slate-600 text-lg leading-relaxed">
          Praxisartikel, Checklisten und Erklärungen rund um BFSG 2025, WCAG, BITV und EN 301 549.
        </p>

        <div className="mt-10 grid gap-4">
          <Link href="/ratgeber/faq" className="group rounded-3xl border border-blue-100 bg-blue-50 p-6 hover:bg-blue-100/60 transition">
            <div className="text-xl font-extrabold text-slate-900 group-hover:text-blue-800 transition">BFSG FAQ: 60 Fragen & Antworten</div>
            <div className="mt-2 text-sm text-slate-700 leading-relaxed">
              Der Schnellstart für Teams: Geltung, Fristen, Anforderungen, Tests, Kosten, Risiken – kompakt erklärt.
            </div>
            <div className="mt-3 text-sm font-bold text-blue-800">Zur FAQ →</div>
          </Link>

          {posts.map((p) => (
            <Link
              key={p.slug}
              href={`/ratgeber/${p.slug}`}
              className="group rounded-3xl border border-slate-200 bg-white p-6 hover:bg-slate-50 transition overflow-hidden"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-stretch">
                <div className="w-full md:w-64 md:order-2 shrink-0">
                  <div className="aspect-video rounded-2xl overflow-hidden bg-slate-100">
                    {p.ogImage ? (
                      <img
                        src={p.ogImage}
                        alt={p.ogImageAlt || p.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-blue-50 via-white to-slate-100" />
                    )}
                  </div>
                </div>
                <div className="min-w-0 md:order-1">
                  <div className="text-xl font-extrabold text-slate-900 group-hover:text-blue-700 transition">
                    {p.title}
                  </div>
                  {p.description && (
                    <div className="mt-2 text-sm text-slate-600 leading-relaxed">
                      {p.description}
                      {p.descriptionTruncated ? "…" : ""}
                    </div>
                  )}
                  <div className="mt-3 text-sm font-bold text-blue-700">Weiterlesen →</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-blue-100 bg-blue-50 p-6">
          <div className="font-extrabold text-slate-900">Schneller BFSG‑Check</div>
          <div className="mt-1 text-slate-700">Sie wollen nicht nur lesen, sondern direkt prüfen? Starten Sie einen Kurz‑Check.</div>
          <Link href="/" className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700">
            Zum Scan
          </Link>
        </div>

        <SiteFooter note="" />
      </div>
    </main>
  );
}
