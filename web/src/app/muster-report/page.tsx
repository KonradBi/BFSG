export const metadata = {
  title: "Muster-Report – BFSG WebCheck",
  description: "Beispielreport (Vorschau) für den BFSG-WebCheck.",
};

import Link from "next/link";

export default function MusterReportPage() {
  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-16">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900">Muster‑Report (Vorschau)</h1>
            <p className="mt-3 text-slate-600 leading-relaxed max-w-2xl">
              Vorschau auf den PDF‑Report. Der echte Report wird nach dem Scan erstellt und nach dem Checkout als PDF verfügbar.
              Hinweis: keine Rechtsberatung.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="#summary" className="px-4 py-2 rounded-full border border-slate-200 bg-white text-sm font-black text-slate-700 hover:bg-slate-50">Summary</Link>
            <Link href="#issues" className="px-4 py-2 rounded-full border border-slate-200 bg-white text-sm font-black text-slate-700 hover:bg-slate-50">Issues</Link>
            <Link href="#fixes" className="px-4 py-2 rounded-full border border-slate-200 bg-white text-sm font-black text-slate-700 hover:bg-slate-50">Fix‑Schritte</Link>
          </div>
        </div>

        <section id="summary" className="mt-10 scroll-mt-28">
          <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">Summary</div>
          <div className="mt-3 rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 text-xs font-bold text-slate-600 flex items-center justify-between">
              <span>Beispiel: Executive Summary</span>
              <span className="text-slate-400">PDF‑Ausschnitt</span>
            </div>
            <img src="/trust/report-summary.png" alt="Beispielreport: Summary" className="w-full h-auto" />
          </div>
        </section>

        <section id="issues" className="mt-12 scroll-mt-28">
          <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">Issues</div>
          <div className="mt-3 rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 text-xs font-bold text-slate-600 flex items-center justify-between">
              <span>Beispiel: Findings / Issues</span>
              <span className="text-slate-400">PDF‑Ausschnitt</span>
            </div>
            <img src="/trust/report-issues.png" alt="Beispielreport: Issues" className="w-full h-auto" />
          </div>
        </section>

        <section id="fixes" className="mt-12 scroll-mt-28">
          <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">Fix‑Schritte</div>
          <div className="mt-3 rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 text-xs font-bold text-slate-600 flex items-center justify-between">
              <span>Beispiel: Fix‑Empfehlungen</span>
              <span className="text-slate-400">PDF‑Ausschnitt</span>
            </div>
            <img src="/trust/report-fixes.png" alt="Beispielreport: Fix‑Schritte" className="w-full h-auto" />
          </div>
        </section>

        <div className="mt-8 text-xs text-slate-500">
          Hinweis: Technischer Report (WCAG / BITV / EN 301 549) – keine Rechtsberatung.
        </div>
      </div>
    </main>
  );
}
