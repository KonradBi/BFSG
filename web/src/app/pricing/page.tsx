import Link from "next/link";

const tiers = [
  {
    id: "mini",
    name: "Audit Mini",
    price: "€29",
    bullets: ["1 URL-Scan", "Vollständiger Bericht", "Konkrete Umsetzungshinweise", "PDF-Export"],
    popular: false,
  },
  {
    id: "standard",
    name: "Audit Standard",
    price: "€59",
    bullets: ["1 URL + 5 Templates", "Kritische Nutzerpfade", "Code-Beispiele", "PDF-Export"],
    popular: true,
  },
  {
    id: "plus",
    name: "Audit Plus",
    price: "€99",
    bullets: ["Standard + erneuter Scan", "Vorher-/Nachher-Vergleich", "Unterstützung bei Fragen", "PDF-Export"],
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground hero-gradient selection:bg-blue-500/30 pt-24 md:pt-32 pb-20 px-4 md:px-6">
      <nav className="fixed top-0 w-full z-50 border-b border-slate-200/60 glass">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">A</div>
            <span className="font-bold tracking-tight text-lg text-slate-900">Shield</span>
          </Link>
          {/* Mobile: icon only */}
          <Link
            href="/"
            aria-label="Zur Startseite"
            className="inline-flex md:hidden items-center justify-center h-10 w-10 rounded-full border border-slate-200 bg-white/70 text-slate-700 hover:text-blue-700"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Link>

          {/* Desktop */}
          <Link href="/" className="hidden md:flex text-sm font-medium text-slate-600 hover:text-blue-600 transition items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Zurück
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12 md:mb-20 animate-fade-in">
          <h1 className="text-4xl md:text-7xl font-black mb-4 md:mb-6 text-slate-900 tracking-tight">Einfaches Pricing.</h1>
          <p className="text-base md:text-xl text-slate-600 max-w-2xl mx-auto">
            Kostenloser Teaser‑Scan → Sie sehen sofort, ob sich ein Audit lohnt. Den vollständigen Bericht schalten Sie einmalig frei.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
          {tiers.map((t, idx) => (
            <div 
              key={t.id} 
              className={`p-6 md:p-8 rounded-[2.5rem] border ${t.popular ? 'border-blue-200 bg-blue-50/50 shadow-xl shadow-blue-500/10' : 'border-slate-100 bg-white shadow-lg'} flex flex-col relative animate-fade-in transition-all md:hover:-translate-y-2`}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {t.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-500/30">Empfohlen</div>}
              <div className="text-xl font-bold mb-2 text-slate-900">{t.name}</div>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-bold text-slate-900">{t.price}</span>
                <span className="text-slate-500 text-sm font-medium uppercase tracking-wider ml-1">einmalig</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {t.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-sm text-slate-600">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-blue-600"><path d="M20 6 9 17l-5-5"/></svg>
                    {b}
                  </li>
                ))}
              </ul>
              <Link
                href={`/scan?prefillTier=${t.id}`}
                className={`block w-full py-4 rounded-2xl text-center font-bold transition-all ${t.popular ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200'}`}
              >
                Teaser-Scan starten
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-20 glass rounded-3xl p-10 border border-slate-200 shadow-xl max-w-3xl mx-auto">
           <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/><path d="M12 16V12"/><path d="M12 8H12.01"/></svg>
             Häufige Fragen zum Pricing
           </h3>
           <div className="space-y-6">
              {[
                { q: "Gibt es versteckte Gebühren?", a: "Nein. Wir arbeiten mit Einmalzahlungen pro Scan. Kein Abo, keine automatische Verlängerung." },
                { q: "Erhalte ich eine Rechnung mit MwSt.?", a: "Ja. Nach der Zahlung über Stripe erhalten Sie sofort eine ordentliche Rechnung für Ihre Buchhaltung." },
                { q: "Was passiert, wenn der Scan fehlschlägt?", a: "Unser Support hilft Ihnen schnell weiter – oder wir erstatten den Betrag, falls die Analyse technisch nicht möglich ist." }
              ].map(faq => (
                <div key={faq.q}>
                  <div className="font-bold text-sm mb-1">{faq.q}</div>
                  <div className="text-sm text-muted-foreground">{faq.a}</div>
                </div>
              ))}
           </div>
        </div>

        <div className="mt-12 text-[10px] text-center text-muted-foreground uppercase font-black tracking-[0.2em]">
          Kein Rechtsrat · Technischer Audit nach WCAG 2.1 / BITV 2.0 / EN 301 549
        </div>
      </div>
    </main>
  );
}
