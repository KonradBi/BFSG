"use client";

import Link from "next/link";
import { useState } from "react";
import AuthNav from "./components/AuthNav";
import BrandMark from "./components/BrandMark";
import { isValidHttpUrl, normalizeUrl } from "./lib/normalizeUrl";

export default function Home() {
  const [url, setUrl] = useState("");

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeUrl(url);
    if (!normalized || !isValidHttpUrl(normalized)) return;
    window.location.href = `/scan?url=${encodeURIComponent(normalized)}`;
  };

  const ScanInput = ({ id, label = "Scan Starten", variant = "default" }: { id: string, label?: string, variant?: "default" | "red" }) => (
    <div id={id} className="max-w-xl mx-auto mb-12">
      <form onSubmit={handleScan} className="relative group">
        <div className={`absolute -inset-1.5 rounded-2xl blur opacity-25 group-focus-within:opacity-40 transition duration-500 ${variant === "red" ? "bg-red-600" : "bg-gradient-to-r from-blue-600 to-indigo-600"}`}></div>
        <div className="relative flex flex-col sm:flex-row gap-2 bg-white border border-slate-200 p-2.5 rounded-2xl shadow-2xl overflow-hidden">
          <input
            type="url"
            placeholder="https://ihre-website.de"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="flex-1 px-6 py-4 outline-none text-lg text-navy-900 placeholder-slate-400 font-medium"
          />
          <button
            type="submit"
            className={`${variant === "red" ? "bg-red-600 hover:bg-red-700 shadow-red-500/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"} text-white px-10 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 button-glow shadow-xl active:scale-[0.98]`}
          >
            {label}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14m-7-7 7 7-7 7" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-blue-500/30 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-200/40 glass">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <BrandMark />
          <div className="hidden lg:flex items-center gap-10 text-sm font-semibold text-slate-600">
            <Link href="#leistungen" className="hover:text-blue-600 transition-colors">Leistungen</Link>
            <Link href="#ablauf" className="hover:text-blue-600 transition-colors">Ablauf</Link>
            <Link href="#testimonials" className="hover:text-blue-600 transition-colors">Referenzen</Link>
            <Link href="#pakete" className="hover:text-blue-600 transition-colors">Preise</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/scans" className="hidden sm:inline-block text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors">
              Übersicht
            </Link>
            <AuthNav />
            <Link
              href="#audit"
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-full text-sm font-black transition-all shadow-lg shadow-red-600/20 active:scale-95 uppercase tracking-wider"
            >
              Jetzt Prüfen
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 px-6 hero-mesh overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-100 bg-red-50 text-[11px] font-black uppercase tracking-widest text-red-600 mb-8 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                </span>
                BFSG 2025: Dringlichkeit Hoch
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 text-navy-900 leading-[1.1]">
                Barrierefreiheit ist kein Zufall – es ist Ihr <span className="text-blue-600">Schutzschild</span>.
              </h1>
              
              <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-xl">
                Sichern Sie Ihre digitale Präsenz ab. Mit dem BFSG-WebCheck identifizieren Sie Compliance-Lücken in Sekunden und erhalten einen glasklaren Fahrplan zur WCAG & BITV Konformität.
              </p>

              <ScanInput id="audit" />
              
              <div className="mt-4 flex items-center gap-3 px-2 mb-12">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Standards:</span>
                <div className="flex gap-2">
                  {["WCAG 2.2", "BITV 2.0", "EN 301 549"].map(s => (
                    <span key={s} className="px-2 py-0.5 rounded border border-slate-200 text-[10px] font-black text-slate-500 bg-white">{s}</span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-8 border-t border-slate-200 pt-10">
                <div>
                  <div className="text-3xl font-black text-navy-900">100+</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reports Erstellt</div>
                </div>
                <div className="w-px h-10 bg-slate-200" />
                <div>
                  <div className="text-3xl font-black text-red-600">2.570+</div>
                  <div className="text-xs font-bold text-red-500 uppercase tracking-wider">Abmahnfallen entdeckt</div>
                </div>
                <div className="w-px h-10 bg-slate-200" />
                <div>
                  <div className="text-3xl font-black text-navy-900">100%</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">BFSG-Fahrplan</div>
                </div>
              </div>
            </div>

            <div className="relative lg:block">
              <div className="absolute -inset-20 bg-blue-100/50 blur-[100px] rounded-full pointer-events-none" />
              <div className="relative z-10 transform lg:rotate-2 hover:rotate-0 transition-transform duration-700">
                <div className="glass rounded-[2.5rem] p-4 shadow-2xl border border-white/40">
                  <img 
                    src="/images/report-mockup.png" 
                    alt="BFSG WebCheck Dashboard Mockup" 
                    className="rounded-[1.75rem] shadow-lg w-full h-auto animate-float"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Section */}
      <section className="section-padding bg-navy-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 grid-pattern pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-red-600/20 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full" />
        
        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-red-600 text-[11px] font-black uppercase tracking-[0.2em] mb-12 shadow-[0_0_30px_rgba(220,38,38,0.4)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>
            Gesetzliche Frist: 28. Juni 2025
          </div>
          
          <h2 className="text-4xl md:text-7xl font-black mb-8 leading-[1.05] font-display">
            Das BFSG 2025 ist keine <span className="text-slate-400">Option</span>.<br/>
            <span className="text-red-500 underline decoration-8 decoration-red-900/50 underline-offset-8">Es ist Gesetz.</span>
          </h2>
          
          <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-20 leading-relaxed font-bold text-slate-200">
            Ab Juni 2025 riskieren Unternehmen ohne barrierefreie Website empfindliche Bußgelder von bis zu <span className="text-red-500 font-black text-3xl md:text-4xl px-2">100.000 €</span> und existenzbedrohende Abmahnwellen.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-24">
            {[
              { t: "Bußgeldrisiko", d: "Strengste Sanktionen bei Verstößen gegen das Barrierefreiheitsstärkungsgesetz.", c: "bg-red-950/40 border-red-500/30" },
              { t: "Abmahngefahr", d: "Spezialisierte Kanzleien nutzen automatisierte Scans zur Massenabmahnung.", c: "bg-white/5 border-white/10" },
              { t: "Ausschluss", d: "Verlust von über 10 Millionen Kunden, die auf Zugänglichkeit angewiesen sind.", c: "bg-white/5 border-white/10" }
            ].map(item => (
              <div key={item.t} className={`p-10 rounded-[2.5rem] border text-left transition-all hover:scale-[1.02] hover:bg-white/10 shadow-2xl ${item.c}`}>
                <div className="w-14 h-14 rounded-2xl bg-red-600/20 flex items-center justify-center mb-8 border border-red-500/20">
                  <svg className="text-red-500" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
                    <path d="M12 8V12" />
                    <path d="M12 16H12.01" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black mb-4">{item.t}</h3>
                <p className="text-slate-300 text-sm leading-relaxed font-semibold">{item.d}</p>
              </div>
            ))}
          </div>

          <div className="p-1 rounded-[3rem] bg-gradient-to-br from-red-600 via-red-900 to-navy-900 shadow-[0_0_50px_rgba(220,38,38,0.2)]">
            <div className="bg-navy-900 rounded-[2.9rem] p-12 md:p-16">
              <h3 className="text-3xl font-black mb-8 italic">Wie hoch ist Ihr Risiko?</h3>
              <ScanInput id="audit-pain" label="Sofort-Check Starten" variant="red" />
            </div>
          </div>
        </div>
      </section>

      {/* Leistungen */}
      <section id="leistungen" className="section-padding px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 animate-fade-in text-navy-900">
            <h2 className="text-4xl md:text-6xl font-black mb-6">Was wir für Sie tun.</h2>
            <p className="text-slate-600 text-xl max-w-2xl mx-auto">
              Ein präzises technisches Audit, das Ihre IT direkt umsetzen kann. Keine vagen Tipps, sondern klare Anweisungen.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                t: "Evidenzbasierte Reports",
                d: "Jeder Fehler wird mit technischem Fundort, Snippet und Impact dokumentiert.",
                i: "M10 13l4 4L19 7"
              },
              {
                t: "Smart Priorisierung",
                d: "Wir gruppieren Findings nach P0 (kritisch) bis P2 (empfohlen) – fokussiert auf Impact.",
                i: "M12 8v4l3 3"
              },
              {
                t: "IT-Ready Blueprints",
                d: "Konkrete Fix-Schritte & Akzeptanzkriterien für Ihre Entwickler oder Agentur.",
                i: "M16 18l6-6-6-6M8 6l-6 6 6 6"
              }
            ].map((c) => (
              <div key={c.t} className="group p-10 rounded-[2.5rem] border border-slate-200 bg-white card-hover">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-8 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={c.i} />
                  </svg>
                </div>
                <h3 className="text-2xl font-black mb-4 text-navy-900">{c.t}</h3>
                <p className="text-slate-600 leading-relaxed">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="section-padding bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-navy-900 mb-6 font-display">Vertrauen durch Klarheit.</h2>
            <p className="text-slate-600 text-xl">Das sagen Experten und Kunden über den BFSG-WebCheck.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                n: "Thomas Meurer",
                r: "Head of Digital, Retail Corp",
                t: "Endlich ein Tool, das Tacheles redet. Die P0-Priorisierung hat uns geholfen, die kritischsten Lücken in zwei Sprints zu schließen.",
                i: "https://i.pravatar.cc/150?u=1"
              },
              {
                n: "Sarah König",
                r: "Agenturleitung, CreativeMind",
                t: "Für unsere Kunden ist das BFSG ein Buch mit sieben Siegeln. Der BFSG-WebCheck übersetzt das Gesetz in machbare Tasks.",
                i: "https://i.pravatar.cc/150?u=2"
              },
              {
                n: "Dr. Marc Wolter",
                r: "Compliance Officer",
                t: "In der Vorbereitung auf 2025 ist dieser technische Check für uns ein unverzichtbares Werkzeug für das Risikomanagement.",
                i: "https://i.pravatar.cc/150?u=3"
              }
            ].map(user => (
              <div key={user.n} className="p-8 rounded-[2rem] bg-white border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-4 mb-6">
                  <img src={user.i} alt={user.n} className="w-12 h-12 rounded-full border-2 border-slate-100" />
                  <div>
                    <div className="font-bold text-navy-900">{user.n}</div>
                    <div className="text-xs text-slate-500 font-semibold">{user.r}</div>
                  </div>
                </div>
                <p className="text-slate-700 italic leading-relaxed font-medium">„{user.t}“</p>
                <div className="mt-6 flex gap-1">
                  {[1, 2, 3, 4, 5].map(x => (
                    <svg key={x} width="16" height="16" fill="#fbbf24" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mid-CTA */}
      <section className="py-20 bg-white border-y border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl font-black text-navy-900 mb-8">Warten Sie nicht auf eine Abmahnung.</h2>
          <ScanInput id="audit-mid" label="Gratis Scan Starten" />
        </div>
      </section>

      {/* Pakete */}
      <section id="pakete" className="section-padding">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-navy-900 mb-6 font-display">Wählen Sie Ihren Schutz.</h2>
            <p className="text-slate-600 text-xl font-medium">Einmalige Investition. Dauerhafter Schutz.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                t: "Quick Start",
                p: "29€",
                d: "Ideal für Landingpages und Solos.",
                b: ["Vollreport für 1 URL", "WCAG & BITV Check", "PDF-Audit Export"],
                href: "/scan?prefillTier=mini",
                accent: false
              },
              {
                t: "Business",
                p: "59€",
                d: "Beliebt für Firmen-Websites.",
                b: ["Check für 10 Key-Pages", "P0-P2 Priorisierung", "Team-Shareable PDF", "Schnelle Analyse"],
                href: "/scan?prefillTier=standard",
                accent: true
              },
              {
                t: "Enterprise",
                p: "99€",
                d: "Für komplexe Shops & Portale.",
                b: ["Bis zu 50 Fokus-URLs", "Repräsentatives Audit", "Entwickler-Snippets", "Priority Support"],
                href: "/scan?prefillTier=plus",
                accent: false
              }
            ].map((c) => (
              <div 
                key={c.t} 
                className={`relative p-10 rounded-[3rem] border shadow-2xl transition-all duration-500 scale-100 hover:scale-[1.02] ${
                  c.accent 
                    ? "bg-navy-900 border-navy-900 text-white ring-8 ring-blue-500/10" 
                    : "bg-white border-slate-200 text-navy-900"
                }`}
              >
                {c.accent && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">
                    Am Meisten Gewählt
                  </div>
                )}
                <div className={`text-sm font-black uppercase tracking-[0.2em] mb-4 ${c.accent ? "text-red-400" : "text-blue-600"}`}>{c.t}</div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className={`text-6xl font-black tracking-tight ${c.accent ? "text-white" : "text-navy-900"}`}>{c.p}</span>
                  <span className={`text-sm font-bold ${c.accent ? "text-slate-300" : "text-slate-500"}`}>einmalig</span>
                </div>
                <p className={`mb-10 text-sm font-bold ${c.accent ? "text-slate-50" : "text-slate-500"}`}>{c.d}</p>
                
                <ul className="mb-12 space-y-5">
                  {c.b.map((x) => (
                    <li key={x} className={`flex items-center gap-3 text-sm font-extrabold ${c.accent ? "text-slate-50" : "text-navy-900"}`}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.accent ? "#ef4444" : "#2563eb"} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      {x}
                    </li>
                  ))}
                </ul>
                
                <Link
                  href={c.href}
                  className={`inline-flex w-full items-center justify-center rounded-2xl px-6 py-5 font-black text-sm transition-all shadow-xl active:scale-95 ${
                    c.accent 
                      ? "bg-red-600 hover:bg-red-500 text-white shadow-red-500/25" 
                      : "bg-navy-900 hover:bg-slate-800 text-white shadow-navy-900/10"
                  }`}
                >
                  Jetzt Starten
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-12 text-xs text-center text-slate-500 font-semibold tracking-wide uppercase opacity-60">
            Wir bieten technische Prüfungen, KEINE Rechtsberatung.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section-padding bg-white relative">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-navy-900 mb-6">Häufige Fragen.</h2>
            <p className="text-slate-600 text-xl font-medium">Was Sie vor dem Start wissen sollten.</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Ist das eine offizielle BFSG-Zertifizierung?",
                a: "Nein. Sie erhalten ein technisches Audit und einen Experten-Prüfbericht. Eine formale Zertifizierung ist ein separater Prozess, für den unser Bericht jedoch das perfekte Fundament legt."
              },
              {
                q: "Ersetzt der Scan einen Anwalt?",
                a: "Der BFSG-WebCheck liefert technische Fakten. Für die rechtliche Einordnung Ihres spezifischen Geschäftsmodells empfehlen wir immer die Rücksprache mit einem spezialisierten Juristen."
              },
              {
                q: "Wie lange dauert ein Audit?",
                a: "Die automatisierte Analyse startet sofort und dauert in der Regel zwischen 3 und 10 Minuten, abhängig von der Größe Ihrer Website."
              },
              {
                q: "Muss ich mich registrieren?",
                a: "Den ersten Schnell-Check können Sie direkt starten. Um den Vollreport herunterzuladen und Ergebnisse zu speichern, ist ein Account notwendig."
              }
            ].map((f) => (
              <details key={f.q} className="group glass p-8 rounded-[2rem] border border-slate-200 cursor-pointer overflow-hidden transition-all duration-300 open:bg-slate-50">
                <summary className="list-none flex justify-between items-center">
                  <span className="text-lg font-bold text-navy-900">{f.q}</span>
                  <span className="text-blue-600 transition-transform group-open:rotate-180">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                  </span>
                </summary>
                <div className="mt-6 text-slate-600 leading-relaxed font-medium">
                  {f.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="section-padding bg-slate-50 relative overflow-hidden">
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-red-600/5 blur-[120px] rounded-full" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-black uppercase mb-8">Letzte Chance zur Absicherung</div>
          <h2 className="text-4xl md:text-6xl font-black text-navy-900 mb-8 font-display">Handeln Sie jetzt.</h2>
          <p className="text-slate-600 text-lg md:text-xl mb-12 font-medium">Bevor die Frist abläuft und die ersten Abmahnwellen starten.</p>
          <ScanInput id="audit-footer" label="Letzter Check" variant="red" />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-6 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-16">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <span className="h-12 w-12 rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm p-2 flex items-center justify-center">
                <img src="/brand/logo.png" alt="BFSG WebCheck Logo" className="w-full h-auto" />
              </span>
              <span className="font-black text-2xl tracking-tighter text-navy-900">BFSG‑WebCheck</span>
            </div>
            <p className="text-slate-500 max-w-sm leading-relaxed font-medium">
              Ihr Partner für digitale Barrierefreiheit. Wir machen das Web für alle zugänglich – und Ihre Website rechtssicher gegen Abmahnungen.
            </p>
          </div>

          <div>
            <h4 className="font-black text-navy-900 mb-8 uppercase tracking-[0.2em] text-xs">Produkt</h4>
            <div className="space-y-4 text-sm font-bold text-slate-500">
              <div><Link href="#audit" className="hover:text-blue-600 transition-colors">Starten</Link></div>
              <div><Link href="#pakete" className="hover:text-blue-600 transition-colors">Preise</Link></div>
              <div><Link href="#faq" className="hover:text-blue-600 transition-colors">FAQ</Link></div>
            </div>
          </div>

          <div>
            <h4 className="font-black text-navy-900 mb-8 uppercase tracking-[0.2em] text-xs">Rechtliches</h4>
            <div className="space-y-4 text-sm font-bold text-slate-500">
              <div><Link href="/impressum" className="hover:text-blue-600 transition-colors">Impressum</Link></div>
              <div><Link href="/datenschutz" className="hover:text-blue-600 transition-colors">Datenschutz</Link></div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-24 pt-12 border-t border-slate-200 text-xs font-bold text-slate-400 flex flex-col md:flex-row justify-between gap-6 uppercase tracking-widest">
          <div>© {new Date().getFullYear()} BFSG‑WebCheck. Alle Rechte vorbehalten.</div>
          <div>WCAG / BITV / EN 301 549 – Konformitätsprüfung</div>
        </div>
      </footer>
    </main>
  );
}
