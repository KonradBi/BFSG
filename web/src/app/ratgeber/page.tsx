import Link from "next/link";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

type Post = {
  slug: string;
  title: string;
  description?: string;
};

function getPosts(): Post[] {
  const dir = path.join(process.cwd(), "content/ratgeber");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const { data, content } = matter(raw);
      const title = String(data.title || file.replace(/\.md$/, ""));
      const slug = String(data.slug || file.replace(/\.md$/, ""));
      // naive excerpt
      const excerpt = content
        .replace(/^---[\s\S]*?---/m, "")
        .replace(/\n+/g, " ")
        .trim()
        .slice(0, 170);
      return { slug, title, description: excerpt };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export default function RatgeberIndex() {
  const posts = getPosts();

  return (
    <main className="min-h-screen bg-background text-foreground hero-gradient selection:bg-blue-500/30 px-4 md:px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
          Ratgeber: BFSG & Barrierefreiheit
        </h1>
        <p className="mt-4 text-slate-600 text-lg leading-relaxed">
          Praxisartikel, Checklisten und Erklärungen rund um BFSG 2025, WCAG, BITV und EN 301 549.
        </p>

        <div className="mt-10 grid gap-4">
          {posts.map((p) => (
            <Link
              key={p.slug}
              href={`/ratgeber/${p.slug}`}
              className="group rounded-3xl border border-slate-200 bg-white p-6 hover:bg-slate-50 transition"
            >
              <div className="text-xl font-extrabold text-slate-900 group-hover:text-blue-700 transition">
                {p.title}
              </div>
              {p.description && <div className="mt-2 text-sm text-slate-600 leading-relaxed">{p.description}…</div>}
              <div className="mt-3 text-sm font-bold text-blue-700">Weiterlesen →</div>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-blue-100 bg-blue-50 p-6">
          <div className="font-extrabold text-slate-900">Schneller BFSG‑Check</div>
          <div className="mt-1 text-slate-700">
            Sie wollen nicht nur lesen, sondern direkt prüfen? Starten Sie einen Kurz‑Check.
          </div>
          <Link
            href="/"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 text-white px-5 py-3 font-black"
          >
            BFSG Check starten
          </Link>
        </div>
      </div>
    </main>
  );
}
