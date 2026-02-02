"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";

type Scan = {
  scanId: string;
  url: string;
  status: string;
  isPaid: boolean;
  tier: string | null;
  locked?: boolean;
  pdfUrl?: string | null;
  progress?: { pagesDone: number; pagesTotal: number } | null;
  totals?: { p0: number; p1: number; p2: number; total: number } | null;
  error?: string | null;
};

export default function ScansPage() {
  const [ids, setIds] = useState<string[]>([]);
  const [rows, setRows] = useState<Scan[]>([]);
  const [busy, setBusy] = useState(false);

  function getToken(scanId: string) {
    try {
      const map = JSON.parse(localStorage.getItem("als_scanTokens") || "{}") as Record<string, string>;
      return map[scanId] || "";
    } catch {
      return "";
    }
  }

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
          const token = getToken(id);
          const res = await fetch(`/api/scans/get?scanId=${encodeURIComponent(id)}`,
            {
              cache: "no-store",
              headers: { accept: "application/json", ...(token ? { "x-scan-token": token } : {}) },
            }
          );
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
      <SiteNav />

      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-slate-900">Ihre Scans</h1>
          <Link href="/scan" className="text-sm font-bold text-blue-700 hover:text-blue-800">
            + Neuer Scan
          </Link>
        </div>

        {!ids.length && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-slate-700">
            <div className="font-extrabold text-slate-900">Noch keine Scans gespeichert.</div>
            <div className="mt-2 text-sm text-slate-600">
              Starten Sie einen neuen Scan. Diese Übersicht speichert Scan-IDs lokal in Ihrem Browser (localStorage).
            </div>
            <div className="mt-4">
              <Link href="/scan" className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700">
                Neuen Scan starten
              </Link>
            </div>
          </div>
        )}

        {busy && <div className="text-sm text-slate-600">Lade…</div>}

        <div className="space-y-3">
          {rows.map((r) => {
            const token = typeof window !== "undefined" ? getToken(r.scanId) : "";
            const scanHref = `/scan?scanId=${encodeURIComponent(r.scanId)}${token ? `&token=${encodeURIComponent(token)}` : ""}`;
            const pdfHref = token ? `/api/report/pdf?scanId=${encodeURIComponent(r.scanId)}&token=${encodeURIComponent(token)}` : "";

            return (
              <div
                key={r.scanId}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-blue-200 hover:bg-slate-50 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-500 uppercase">{r.tier ?? "teaser"}</div>
                    <Link href={scanHref} className="font-extrabold text-slate-900 truncate block">
                      {r.url}
                    </Link>
                    <div className="mt-2 text-xs font-bold text-slate-600">
                      Status: {r.status}
                      {r.progress ? ` · ${r.progress.pagesDone}/${r.progress.pagesTotal}` : ""}
                      {r.isPaid ? " · bezahlt" : ""}
                      {r.locked ? " · gesperrt (Token fehlt)" : ""}
                    </div>
                    {r.error && <div className="mt-2 text-xs font-bold text-red-700">Fehler: {r.error}</div>}

                    <div className="mt-4 flex items-center gap-3">
                      <Link href={scanHref} className="text-sm font-black text-blue-700 hover:text-blue-800">
                        Öffnen
                      </Link>
                      {r.isPaid && token && (
                        <a
                          href={pdfHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-black text-slate-900 hover:text-slate-700"
                        >
                          PDF herunterladen
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-black text-slate-900">{r.totals?.total ?? "–"}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Befunde</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <SiteFooter note="Hinweis: Diese Übersicht speichert Scan-IDs lokal im Browser (localStorage)." />
      </div>
    </main>
  );
}
