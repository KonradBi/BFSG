"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Scan = {
  scanId: string;
  url: string;
  status: string;
  isPaid: boolean;
  tier: string | null;
  progress?: { pagesDone: number; pagesTotal: number } | null;
  totals?: { p0: number; p1: number; p2: number; total: number } | null;
  error?: string | null;
};

export default function ScansPage() {
  const [ids, setIds] = useState<string[]>([]);
  const [rows, setRows] = useState<Scan[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const key = "als_scanIds";
      const saved = JSON.parse(localStorage.getItem(key) || "[]") as string[];
      setIds(saved);
    } catch {
      setIds([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!ids.length) {
        setRows([]);
        return;
      }
      setBusy(true);
      try {
        const items: Scan[] = [];
        for (const id of ids) {
          const res = await fetch(`/api/scans/get?scanId=${encodeURIComponent(id)}`, { cache: "no-store" });
          if (!res.ok) continue;
          const data = (await res.json()) as Scan;
          items.push(data);
        }
        if (!cancelled) setRows(items);
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [ids]);

  return (
    <main className="min-h-screen bg-background text-foreground hero-gradient pt-24 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-slate-900">Ihre Scans</h1>
          <Link href="/scan" className="text-sm font-bold text-blue-700 hover:text-blue-800">
+ Neuer Scan
          </Link>
        </div>

        {!ids.length && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-slate-600">
            Noch keine Scans auf diesem Gerät gespeichert.
          </div>
        )}

        {busy && <div className="text-sm text-slate-600">Lade…</div>}

        <div className="space-y-3">
          {rows.map((r) => (
            <Link
              key={r.scanId}
              href={`/scan?scanId=${encodeURIComponent(r.scanId)}`}
              className="block bg-white rounded-2xl border border-slate-200 p-5 hover:border-blue-200 hover:bg-slate-50 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-500 uppercase">{r.tier ?? "teaser"}</div>
                  <div className="font-extrabold text-slate-900 truncate">{r.url}</div>
                  <div className="mt-2 text-xs font-bold text-slate-600">
                    Status: {r.status}
                    {r.progress ? ` · ${r.progress.pagesDone}/${r.progress.pagesTotal}` : ""}
                    {r.isPaid ? " · bezahlt" : ""}
                  </div>
                  {r.error && <div className="mt-2 text-xs font-bold text-red-700">Fehler: {r.error}</div>}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-slate-900">{r.totals?.total ?? "–"}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Befunde</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-xs text-slate-500">
          Hinweis: Diese Übersicht zeigt Scans, die lokal (localStorage) gespeichert sind.
        </div>
      </div>
    </main>
  );
}
