import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold">
          Deutschland · WCAG/BITV/EN 301 549
        </div>

        <h1 className="mt-6 text-4xl sm:text-6xl font-bold tracking-tight">
          Website-Barrierefreiheit prüfen –
          <span className="block text-slate-500">in 60 Sekunden.</span>
        </h1>

        <p className="mt-5 text-lg text-slate-600 max-w-2xl">
          Kostenloser Scan zeigt dir, <b>wie viele Probleme</b> wir finden. Den vollständigen Audit‑Report (Prioritäten + Fix‑Snippets)
          schaltest du ab <b>€29 einmalig</b> frei.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            href="/scan"
            className="rounded-xl bg-black px-5 py-3 text-white font-semibold text-center"
          >
            Jetzt Seite scannen
          </Link>
          <Link
            href="/pricing"
            className="rounded-xl border px-5 py-3 font-semibold text-center"
          >
            Preise ansehen
          </Link>
        </div>

        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {[
            {
              t: "Teaser statt Roman",
              d: "Wir zeigen dir zuerst nur die Anzahl + 1 Beispiel. Den Rest gibt’s nach dem Freischalten.",
            },
            {
              t: "Fix-Rezepte",
              d: "Konkrete Snippets/Anweisungen (HTML/CSS/ARIA) + Priorität P0–P2.",
            },
            {
              t: "Kein Legal-Gelaber",
              d: "Technische Standards (WCAG/EN 301 549/BITV) – keine Rechtsberatung.",
            },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border p-5">
              <div className="font-semibold">{c.t}</div>
              <div className="mt-2 text-sm text-slate-600">{c.d}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
