"use client";

import { useMemo, useState } from "react";

type Teaser = {
  scanId: string;
  url: string;
  totals: { p0: number; p1: number; p2: number; total: number };
  sampleFinding: { title: string; severity: "P0" | "P1" | "P2"; hint: string };
};

export default function ScanPage() {
  const [url, setUrl] = useState("https://");
  const [busy, setBusy] = useState(false);
  const [teaser, setTeaser] = useState<Teaser | null>(null);
  const [tier, setTier] = useState("mini");

  const tiers = useMemo(
    () => [
      { id: "mini", label: "€29 Mini" },
      { id: "standard", label: "€59 Standard" },
      { id: "plus", label: "€99 Plus" },
    ],
    []
  );

  async function runScan() {
    setBusy(true);
    setTeaser(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as Teaser;
      setTeaser(data);
    } finally {
      setBusy(false);
    }
  }

  async function unlock() {
    if (!teaser) return;
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scanId: teaser.scanId, tier }),
    });
    const data = await res.json();
    if (data?.url) window.location.href = data.url;
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl sm:text-4xl font-bold">Jetzt Seite scannen</h1>
        <p className="mt-2 text-slate-600">
          Wir zeigen dir nach dem Scan nur die Anzahl + 1 Beispiel. Den vollständigen Report schaltest du danach frei.
        </p>

        <div className="mt-8 rounded-2xl border p-5">
          <label className="text-sm font-semibold">URL</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="mt-2 w-full rounded-xl border px-3 py-2"
            placeholder="https://deine-domain.de"
          />
          <button
            onClick={runScan}
            disabled={busy || !url.startsWith("http")}
            className="mt-4 w-full rounded-xl bg-black px-4 py-2.5 text-white font-semibold disabled:opacity-50"
          >
            {busy ? "Scanne…" : "Scan starten"}
          </button>
        </div>

        {teaser && (
          <div className="mt-8 rounded-2xl border p-6">
            <div className="text-sm text-slate-500">Ergebnis für {teaser.url}</div>
            <div className="mt-2 text-2xl font-bold">
              {teaser.totals.total} Probleme gefunden
              <span className="text-sm font-semibold text-slate-500"> (P0 {teaser.totals.p0} · P1 {teaser.totals.p1} · P2 {teaser.totals.p2})</span>
            </div>

            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">Beispiel (1 von {teaser.totals.total})</div>
              <div className="mt-1 font-semibold">[{teaser.sampleFinding.severity}] {teaser.sampleFinding.title}</div>
              <div className="mt-1 text-sm text-slate-600">{teaser.sampleFinding.hint}</div>
            </div>

            <div className="mt-5">
              <div className="text-sm font-semibold">Vollständigen Report freischalten</div>
              <div className="mt-2 flex gap-2 flex-wrap">
                {tiers.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTier(t.id)}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold ${tier === t.id ? "bg-black text-white" : "bg-white"}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <button
                onClick={unlock}
                className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-white font-semibold"
              >
                Jetzt freischalten
              </button>

              <div className="mt-3 text-xs text-slate-500">
                Kein Rechtsrat. Technischer Scan (WCAG/EN 301 549/BITV) – Ergebnisse können False Positives enthalten.
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
