export const metadata = {
  title: "Muster-Report – BFSG WebCheck",
  description: "Beispielreport (Vorschau) für den BFSG-WebCheck.",
};

export default function MusterReportPage() {
  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900">Muster‑Report (Vorschau)</h1>
        <p className="mt-3 text-slate-600 leading-relaxed">
          Das ist eine Vorschau auf den PDF‑Report (Mock). Der echte Report wird nach dem Scan erstellt und nach dem
          Checkout als PDF verfügbar.
        </p>

        <div className="mt-10 rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 text-xs font-bold text-slate-600 flex items-center justify-between">
            <span>Beispiel: BFSG‑WebCheck Report (Mock)</span>
            <span className="text-slate-400">Vorschau</span>
          </div>
          <img src="/images/report-mock.png" alt="Beispielreport (Mock)" className="w-full h-auto" />
        </div>

        <div className="mt-6 text-xs text-slate-500">
          Hinweis: Technischer Report (WCAG / BITV / EN 301 549) – keine Rechtsberatung.
        </div>
      </div>
    </main>
  );
}
