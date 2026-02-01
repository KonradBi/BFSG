"use client";

import Link from "next/link";
import { useState } from "react";
import AuthNav from "./components/AuthNav";
import BrandMark from "./components/BrandMark";
import { isValidHttpUrl, normalizeUrl } from "./lib/normalizeUrl";

type CopyVariant = {
  heroBadge: string;
  heroH1: string;
  heroSubhead: string;
  painHeadline: string;
  painSubhead: string;
  painBullets: string[];
  primaryCta: string;
  secondaryCta: string;
  pricingHeadline: string;
  pricingSubhead: string;
};

export default function Home() {
  const [url, setUrl] = useState("");

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeUrl(url);
    if (!normalized || !isValidHttpUrl(normalized)) return;
    window.location.href = `/scan?url=${encodeURIComponent(normalized)}`;
  };

  // --- Copy variants ---
  // Default = "neutral".
  const copy: CopyVariant = {
    // NEUTRAL
    heroBadge: "BFSG 2025: In 2 Minuten wissen, wo Sie angreifbar sind (technischer Check – keine Rechtsberatung)",
    heroH1: "BFSG‑WebCheck: In Minuten Klarheit, ob Ihre Website Abmahn‑Risiken hat",
    heroSubhead:
      "Kostenloser Kurz‑Check + optionaler Vollreport: Wir finden die wichtigsten Barrierefreiheits‑Probleme (WCAG/BITV/EN 301 549) und zeigen Ihnen konkret, was Sie als Nächstes beheben sollten.",

    painHeadline: "Warum jetzt? Weil " + "\"wird schon passen\"" + " teuer werden kann.",
    painSubhead:
      "Viele Websites sind nicht absichtlich " + "\"nicht barrierefrei\"" + ", aber kleine Fehler reichen schon: fehlende Labels, schlechte Kontraste, kaputte Tastaturbedienung. Genau das wird bei Beschwerden sichtbar.",
    painBullets: [
      "Schnell wissen, ob Sie ein Risiko haben – bevor jemand anderes es meldet.",
      "Konkrete, priorisierte To‑Dos (P0/P1/P2) statt vager Empfehlungen.",
      "Spart Zeit mit Agentur/Dev: Sie erhalten direkt umsetzbare Hinweise.",
    ],

    primaryCta: "Jetzt Kurz‑Check starten",
    secondaryCta: "Muster‑Report ansehen",

    pricingHeadline: "Transparente Pakete nach Umfang",
    pricingSubhead:
      "Sie erhalten vorab ein Scope‑Angebot. Optional: Re‑Check nach Umsetzung. Keine Rechtsberatung.",

    // AGGRESSIVE (optional)
    // heroBadge: "BFSG 2025: Handlungsbedarf frühzeitig klären",
    // heroH1: "BFSG 2025: Website‑Barrierefreiheit jetzt prüfen – mit Maßnahmenplan",
    // heroSubhead:
    //   "Audit nach WCAG/BITV/EN 301 549 inkl. Priorisierung und ticket‑fähigen Empfehlungen. Hinweis: keine Rechtsberatung.",
    // primaryCta: "Schnelles Angebot anfordern",
    // secondaryCta: "Beispielreport downloaden",

    // ENTERPRISE (optional)
    // heroBadge: "Für Teams mit Compliance‑Anspruch",
    // heroH1: "Audit zur digitalen Barrierefreiheit – dokumentiert & nachvollziehbar",
    // heroSubhead:
    //   "Prüfung nach WCAG/BITV/EN 301 549 mit abgestimmtem Scope, reproduzierbaren Findings und optionalem Re‑Check. Hinweis: keine Rechtsberatung.",
    // primaryCta: "Scope‑Workshop anfragen",
    // secondaryCta: "Musterbericht für Procurement",
  };

  return (
    <main className="min-h-screen bg-background text-foreground hero-gradient selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="sticky top-0 w-full z-50 border-b border-slate-200/60 glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <BrandMark />
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#leistungen" className="hover:text-foreground transition-colors">
              Leistungen
            </Link>
            <Link href="#ablauf" className="hover:text-foreground transition-colors">
              Ablauf
            </Link>
            <Link href="#pakete" className="hover:text-foreground transition-colors">
              Pakete
            </Link>
            <Link href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/scans" className="text-sm font-medium hover:text-blue-400 transition-colors">
Übersicht
            </Link>

            <AuthNav />

            <Link
              href="#audit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold transition-all"
            >
              {copy.primaryCta}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 opacity-60">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100 blur-[100px] rounded-full mix-blend-multiply" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-100 blur-[100px] rounded-full mix-blend-multiply" />
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-100 bg-blue-50 text-xs font-bold text-blue-600 mb-6 animate-fade-in shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            {copy.heroBadge}
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 text-slate-900 leading-[1.08]">
                {copy.heroH1}
              </h1>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">{copy.heroSubhead}</p>

              <form onSubmit={handleScan} id="audit" className="relative group max-w-xl">
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative flex flex-col sm:flex-row gap-2 bg-white border border-slate-200 p-2 rounded-2xl shadow-xl transition-all">
                  <input
                    type="text"
                    inputMode="url"
                    placeholder="https://www.ihrewebseite.de"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    className="flex-1 bg-transparent px-4 py-4 outline-none text-lg text-slate-900 placeholder-slate-400"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shadow-blue-500/20"
                  >
                    Kurz‑Check
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14m-7-7 7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </form>

              <div className="mt-4 flex items-center gap-3 text-sm">
                <Link
                  href="#pakete"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-slate-700 hover:bg-slate-50"
                >
                  {copy.primaryCta}
                </Link>
                <Link
                  href="/muster-report"
                  className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-bold text-blue-700 hover:text-blue-800"
                >
                  {copy.secondaryCta}
                </Link>
              </div>

              <div className="mt-6 text-sm text-slate-600 leading-relaxed">
                <div className="font-semibold text-slate-900 mb-2">Typische Suchanfragen, die wir abdecken</div>
                <ul className="grid sm:grid-cols-2 gap-2 list-disc list-inside">
                  <li>„BFSG Website prüfen“</li>
                  <li>„Barrierefreiheit Website Audit“</li>
                  <li>„BITV Test“</li>
                  <li>„WCAG Audit“</li>
                  <li>„EN 301 549 Website“</li>
                  <li>„Barrierefreiheit Audit Kosten“</li>
                </ul>
              </div>

              {/* Social proof / standards */}
              <div className="mt-8 max-w-xl">
                <div className="text-center text-xs font-bold text-slate-500 mb-3">
                  Bereits <span className="text-slate-900">100+</span> technische Checks erstellt
                </div>

                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {["WCAG", "EN 301 549", "BITV"].map((x) => (
                    <span
                      key={x}
                      className="px-3 py-1 rounded-full border border-slate-200 bg-white text-[11px] font-black text-slate-700"
                    >
                      {x}
                    </span>
                  ))}
                </div>

                <div className="mt-2 text-center text-[11px] text-slate-500">
                  Technischer Report (kein Rechtsgutachten) · automatisierte Checks + Empfehlung zur manuellen Prüfung
                </div>
              </div>
            </div>

            {/* Report mock instead of random illustrations */}
            <div className="relative" id="beispiel">
              <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full" />

              <div className="relative z-10 w-full max-w-[560px] mx-auto rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 text-xs font-bold text-slate-600 flex items-center justify-between">
                  <span>Beispiel: BFSG‑WebCheck Report (PDF)</span>
                  <span className="text-slate-400">Mock</span>
                </div>
                <img src="/images/report-mock.png" alt="Beispielreport (PDF Vorschau)" className="w-full h-auto" />
              </div>

              <div className="mt-6 text-xs text-slate-500 text-center">
                Prüfrahmen: WCAG / BITV / EN 301 549 (technische Prüfung, keine Rechtsberatung)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain section */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto glass rounded-[3rem] p-10 border border-slate-200">
          <div className="grid md:grid-cols-2 gap-10 items-start">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">{copy.painHeadline}</h2>
              <p className="text-slate-700 leading-relaxed">{copy.painSubhead}</p>
              <p className="mt-4 text-xs text-slate-500">
                Quellenhinweis: § 37 BFSG (Bußgeldvorschriften) – <a className="underline" href="https://www.gesetze-im-internet.de/bfsg/__37.html" target="_blank" rel="noreferrer">gesetze‑im‑internet.de</a>
              </p>
            </div>
            <div>
              <ul className="space-y-3">
                {copy.painBullets.map((b) => (
                  <li key={b} className="flex gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-red-600/15 border border-red-600/30 flex items-center justify-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                    </div>
                    <div className="text-sm text-slate-800 leading-relaxed">{b}</div>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link
                  href="#audit"
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 text-white px-5 py-3 font-black"
                >
                  Jetzt Kurz‑Check starten
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leistungen */}
      <section id="leistungen" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-4 text-slate-900">Was Sie bekommen</h2>
            <p className="text-slate-600 max-w-3xl mx-auto">
              Ein nachvollziehbarer Prüfbericht mit Evidenz, Prioritäten und umsetzbaren Empfehlungen – geeignet für Marketing, Produkt und IT.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                t: "Prüfbericht mit Evidenz",
                d: "Findings mit Fundstellen, Beschreibung, Impact und (wo möglich) Screenshot/Snippet.",
              },
              {
                t: "Priorisierung",
                d: "Einordnung nach Nutzer‑Impact (P0/P1/P2) – damit Teams schneller entscheiden.",
              },
              {
                t: "Ticket‑fähige Empfehlungen",
                d: "Konkrete Fix‑Schritte & Akzeptanzkriterien, die direkt ins Backlog können.",
              },
            ].map((c) => (
              <div
                key={c.t}
                className="group p-8 rounded-3xl border border-slate-100 bg-white hover:bg-slate-50 transition-all hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5"
              >
                <h3 className="text-xl font-bold mb-3 text-slate-900">{c.t}</h3>
                <p className="text-slate-600 leading-relaxed">{c.d}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid md:grid-cols-3 gap-8">
            {[
              { t: "In Minuten statt Tagen", d: "Kurz‑Check + Report werden in der Regel in wenigen Minuten generiert (je nach Website/Last)." },
              { t: "Deterministische Ergebnisse", d: "Stabiler Audit‑State + normalisierte Findings – damit Reports reproduzierbar sind." },
              { t: "Re‑Scan nach Fixes", d: "Nach Änderungen einfach erneut prüfen und den Fortschritt verifizieren." },
            ].map((c) => (
              <div key={c.t} className="p-8 rounded-3xl border border-slate-100 bg-white">
                <h3 className="text-lg font-bold mb-2 text-slate-900">{c.t}</h3>
                <p className="text-slate-600 leading-relaxed">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ablauf */}
      <section id="ablauf" className="py-24 px-6 bg-slate-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-6xl font-bold mb-4 text-slate-900">So läuft der BFSG‑WebCheck ab</h2>
            <p className="text-slate-600 max-w-3xl mx-auto">
              Transparent, strukturiert und auf euer Angebot abgestimmt – vom Scope bis zur Übergabe.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { n: "1", t: "URL eingeben", d: "Kurz‑Check für eine Website‑URL starten." },
              { n: "2", t: "Scan läuft", d: "Automatisierte Checks nach WCAG/BITV/EN 301 549." },
              { n: "3", t: "Teaser sehen", d: "Prioritäten (P0–P2) + ein Beispiel‑Finding als Vorschau." },
              { n: "4", t: "Freischalten & PDF", d: "Zahlung → Vollreport + PDF‑Export sofort verfügbar." },
            ].map((s) => (
              <div key={s.n} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black mb-4">{s.n}</div>
                <div className="font-extrabold text-slate-900 mb-2">{s.t}</div>
                <div className="text-sm text-slate-600 leading-relaxed">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pakete */}
      <section id="pakete" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-6xl font-bold mb-4 text-slate-900">{copy.pricingHeadline}</h2>
            <p className="text-slate-600 max-w-3xl mx-auto">{copy.pricingSubhead}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                t: "Mini",
                p: "€29 einmalig",
                d: "Für eine URL – Vollreport + PDF.",
                b: ["1 URL", "Vollreport (P0–P2)", "PDF‑Export"],
                href: "/scan?prefillTier=mini",
              },
              {
                t: "Standard",
                p: "€59 einmalig",
                d: "Wichtige Seiten – bis zu 10 URLs.",
                b: ["bis 10 Seiten", "Vollreport (P0–P2)", "PDF‑Export"],
                href: "/scan?prefillTier=standard",
              },
              {
                t: "Plus",
                p: "€99 einmalig",
                d: "Repräsentatives Audit – ideal für große Websites/Shops.",
                b: ["bis 50 Seiten (repräsentativ)", "Vollreport (P0–P2)", "PDF‑Export"],
                href: "/scan?prefillTier=plus",
              },
            ].map((c) => (
              <div key={c.t} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">{c.t}</div>
                <div className="text-3xl font-black text-slate-900 mt-2">{c.p}</div>
                <p className="text-slate-600 mt-3">{c.d}</p>
                <ul className="mt-6 space-y-2 text-sm text-slate-700">
                  {c.b.map((x) => (
                    <li key={x} className="flex gap-2">
                      <span className="text-blue-700 font-black">✓</span>
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link
                    href={c.href}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 text-white px-4 py-3 font-black"
                  >
                    Kurz‑Check starten
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs text-center text-slate-500">
            Hinweis: Wir bieten keine Rechtsberatung. Wir liefern technische Prüfungen und Umsetzungsempfehlungen.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6 bg-slate-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-6xl font-bold mb-4 text-slate-900">FAQ</h2>
            <p className="text-slate-600 max-w-3xl mx-auto">
              Kurz & klar – damit intern (und extern) keine Missverständnisse entstehen.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                q: "Ist das eine BFSG‑Zertifizierung?",
                a: "Nein. Sie erhalten ein technisches Audit und einen Prüfbericht. Eine formale Zertifizierung bzw. rechtliche Bewertung ist nicht Bestandteil.",
              },
              {
                q: "Ist das Rechtsberatung?",
                a: "Nein. Wir prüfen technische Kriterien nach WCAG/BITV/EN 301 549 und geben Umsetzungsempfehlungen. Für rechtliche Einordnung ggf. juristische Beratung.",
              },
              {
                q: "Welche Standards deckt ihr ab?",
                a: "Je nach Scope orientieren wir uns an WCAG (aktuelle Version), BITV‑Anforderungen und EN 301 549. Der genaue Prüfrahmen wird vorab festgelegt.",
              },
              {
                q: "Wie schnell bekommen wir Ergebnisse?",
                a: "In der Regel in wenigen Minuten nach Start des Scans (abhängig von Website und aktueller Auslastung).",
              },
              {
                q: "Könnt ihr auch bei der Umsetzung helfen?",
                a: "Optional ja: Priorisierung, Ticket‑Formulierung, Re‑Checks. Umsetzung/Entwicklung nach Absprache.",
              },
              {
                q: "Warum sollte ich jetzt prüfen?",
                a: "Weil spätes Nachrüsten teuer wird. Früh prüfen heißt: klare Prioritäten, planbare Tickets und weniger Stress kurz vor Deadlines.",
              },
            ].map((f) => (
              <div key={f.q} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <div className="font-extrabold text-slate-900 mb-2">{f.q}</div>
                <div className="text-slate-600 leading-relaxed">{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-slate-200 bg-slate-50/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="max-w-sm">
            <div className="flex items-center gap-2 mb-6">
              <span className="h-9 w-9 rounded-lg overflow-hidden bg-white border border-slate-200">
                <img src="/brand/logo.png" alt="BFSG WebCheck" className="h-full w-full object-cover object-top" />
              </span>
              <span className="font-bold tracking-tight text-lg">BFSG‑WebCheck</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Technisches Audit‑Tool für digitale Barrierefreiheit. Keine Rechtsberatung.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-12 text-sm">
            <div>
              <div className="font-bold mb-4">Produkt</div>
              <div className="space-y-3 text-muted-foreground">
                <div>
                  <Link href="/scan" className="hover:text-blue-400 Transition">
                    Kurz‑Check
                  </Link>
                </div>
                <div>
                  <Link href="#pakete" className="hover:text-blue-400 Transition">
                    Pakete
                  </Link>
                </div>
                <div>
                  <Link href="#faq" className="hover:text-blue-400 Transition">
                    FAQ
                  </Link>
                </div>
              </div>
            </div>
            <div>
              <div className="font-bold mb-4">Rechtliches</div>
              <div className="space-y-3 text-muted-foreground">
                <div>
                  <Link href="/impressum" className="hover:text-blue-400 Transition">
                    Impressum
                  </Link>
                </div>
                <div>
                  <Link href="/datenschutz" className="hover:text-blue-400 Transition">
                    Datenschutz
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-slate-200 text-xs text-slate-400 flex flex-col md:flex-row justify-between gap-4">
          <div>© {new Date().getFullYear()} BFSG‑WebCheck. Alle Rechte vorbehalten.</div>
          <div>WCAG / BITV / EN 301 549 – technische Konformitätsprüfung (keine Rechtsberatung)</div>
        </div>
      </footer>
    </main>
  );
}
