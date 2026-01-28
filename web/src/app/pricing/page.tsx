import Link from "next/link";

const tiers = [
  {
    id: "mini",
    name: "Audit TO‑GO Mini",
    price: "€29 einmalig",
    bullets: ["1 URL", "voller Report + Prioritäten", "Fix‑Snippets", "PDF Export"],
  },
  {
    id: "standard",
    name: "Audit TO‑GO Standard",
    price: "€59 einmalig",
    bullets: ["1 URL + bis 5 Templates", "Checkout/Kontakt/Start etc.", "PDF Export"],
  },
  {
    id: "plus",
    name: "Audit TO‑GO Plus",
    price: "€99 einmalig",
    bullets: ["Standard + Re‑Scan", "Vorher/Nachher Summary", "Prioritäten + Fix‑Snippets"],
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Preise</h1>
        <p className="mt-3 text-slate-600 max-w-2xl">
          Du startest mit einem kostenlosen Scan (Teaser). Den vollständigen Audit‑Report schaltest du einmalig frei.
        </p>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {tiers.map((t) => (
            <div key={t.id} className="rounded-2xl border p-6">
              <div className="text-lg font-semibold">{t.name}</div>
              <div className="mt-2 text-3xl font-bold">{t.price}</div>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {t.bullets.map((b) => (
                  <li key={b}>• {b}</li>
                ))}
              </ul>
              <div className="mt-6">
                <Link
                  href={`/scan?prefillTier=${t.id}`}
                  className="block rounded-xl bg-black px-4 py-2.5 text-white font-semibold text-center"
                >
                  Jetzt scannen
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-xs text-slate-500 max-w-3xl">
          Hinweis: Kein Rechtsrat. Wir prüfen automatisiert technische Kriterien (WCAG/EN 301 549/BITV) und geben technische
          Hinweise zur Umsetzung.
        </div>
      </div>
    </main>
  );
}
