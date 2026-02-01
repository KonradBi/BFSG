"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import AuthNav from "../components/AuthNav";
import BrandMark from "../components/BrandMark";
import { isValidHttpUrl, normalizeUrl } from "../lib/normalizeUrl";

type Teaser = {
  scanId: string;
  scanToken: string;
  url: string;
  totals: { p0: number; p1: number; p2: number; total: number };
  sampleFinding: { title: string; severity: "P0" | "P1" | "P2"; hint: string };
  pdfUrl?: string;
};

type ScanRecord = {
  scanId: string;
  url: string;
  status: string;
  isPaid: boolean;
  tier: string | null;
  plan?: { maxPages: number; maxWallTimeMs: number; maxPerPageTimeMs: number } | null;
  progress?: { pagesDone: number; pagesTotal: number } | null;
  pages?: { url: string; mode: "FULL" | "LIGHT" | "STATIC"; ms: number }[] | null;
  error?: string | null;
  totals: Teaser["totals"] | null;
  sampleFinding: Teaser["sampleFinding"] | null;
  findings?: unknown[];
  previousScanId?: string | null;
  diffSummary?: { fixed: number; new: number; persisting: number } | null;
};

type Finding = {
  severity: "P0" | "P1" | "P2";
  ruleId?: string;
  title?: string;
  description?: string;
  helpUrl?: string | null;
  selector?: string | null;
  snippet?: string | null;
  failureSummary?: string | null;
  fixSteps?: string[];
  pageUrl?: string;
  capturedAt?: string;
};

const DE_RULE_TITLES: Record<string, { title: string; description?: string }> = {
  "link-name": {
    title: "Links müssen einen erkennbaren Text haben",
    description: "Links benötigen einen zugänglichen Namen (sichtbarer Text oder aria-label/aria-labelledby).",
  },
  "color-contrast": {
    title: "Text/Elemente müssen ausreichenden Kontrast haben",
    description: "Der Kontrast zwischen Vordergrund und Hintergrund muss die WCAG-Mindestwerte erfüllen.",
  },
  "image-alt": {
    title: "Bilder benötigen Alternativtexte",
    description: "Informative Bilder brauchen ein sinnvolles alt-Attribut; dekorative Bilder alt=\"\".",
  },
  label: {
    title: "Formularfelder benötigen Labels",
    description: "Formularfelder brauchen einen zugänglichen Namen (Label/aria-label/aria-labelledby).",
  },
  "heading-order": {
    title: "Überschriften-Hierarchie sollte ohne Sprünge sein",
    description:
      "Überschriften (H1–H6) sollten die Seitenstruktur abbilden (z.B. H2 → H3 → H4). Sprünge (z.B. H2 → H4) sind meist kein Blocker, erschweren aber Screenreader-Navigation.",
  },
  "landmark-one-main": {
    title: "Dokument braucht genau einen Hauptbereich (main)",
    description: "Es sollte genau ein <main>-Landmark pro Seite vorhanden sein.",
  },
  region: {
    title: "Inhalte sollen in Landmarken liegen",
    description: "Seiteninhalt sollte innerhalb von Landmarken (header/nav/main/footer/aside) liegen.",
  },
  "render-failed": {
    title: "Seite konnte nicht stabil geladen werden",
  },
};

function translateFailureSummary(s?: string | null) {
  if (!s) return s;
  return String(s)
    .replace(/^Fix all of the following:/gm, "Beheben Sie Folgendes:")
    .replace(/^Fix any of the following:/gm, "Beheben Sie mindestens eines der folgenden Probleme:")
    .replace(/^Ensure /gm, "Stellen Sie sicher, dass ")
    .replace(/Document does not have a main landmark/g, "Das Dokument hat keinen <main>-Bereich")
    .replace(/Some page content is not contained by landmarks/g, "Ein Teil des Seiteninhalts liegt nicht innerhalb von Landmarken")
    .replace(/Element does not have accessible text/g, "Element hat keinen zugänglichen Text")
    .replace(/Element has no title attribute/g, "Element hat kein title-Attribut")
    .replace(/aria-label attribute does not exist or is empty/g, "aria-label fehlt oder ist leer")
    .replace(/aria-labelledby attribute does not exist/g, "aria-labelledby fehlt")
    .replace(/references elements that do not exist/g, "referenziert Elemente, die nicht existieren")
    .replace(/references elements that are empty/g, "referenziert leere Elemente");
}

function translateFinding(f: Finding) {
  const ruleId = String(f.ruleId || "");
  const map = DE_RULE_TITLES[ruleId];

  const title = map?.title ?? f.title;
  const description = map?.description ?? f.description;

  return {
    title,
    description,
    failureSummary: translateFailureSummary(f.failureSummary),
    originalFailureSummary: f.failureSummary,
  };
}

function severityBadge(sev: "P0" | "P1" | "P2") {
  if (sev === "P0") return "bg-red-100 text-red-700";
  if (sev === "P1") return "bg-orange-100 text-orange-700";
  return "bg-yellow-100 text-yellow-800";
}

function ScanContent() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [teaser, setTeaser] = useState<Teaser | null>(null);
  const [discoveredPages, setDiscoveredPages] = useState<number | null>(null);
  const [liveProgress, setLiveProgress] = useState<{ pagesDone: number; pagesTotal: number } | null>(null);
  const [liveStep, setLiveStep] = useState<string>("");
  // Default to the cheapest plan; we can show a recommendation separately.
  const [tier, setTier] = useState("mini");
  const [record, setRecord] = useState<ScanRecord | null>(null);
  const [authorizedToScan, setAuthorizedToScan] = useState(false);

  const { status: authStatus } = useSession();
  const [localDiff, setLocalDiff] = useState<{ fixed: number; new: number; persisting: number } | null>(null);

  function getToken(scanId: string) {
    try {
      const map = JSON.parse(localStorage.getItem("als_scanTokens") || "{}") as Record<string, string>;
      return map[scanId] || "";
    } catch {
      return "";
    }
  }

  function setToken(scanId: string, token: string) {
    try {
      const map = JSON.parse(localStorage.getItem("als_scanTokens") || "{}") as Record<string, string>;
      map[scanId] = token;
      localStorage.setItem("als_scanTokens", JSON.stringify(map));
    } catch {
      // ignore
    }
  }

  async function fetchRecord(scanId: string) {
    const tokenFromQuery = searchParams.get("token") || "";
    const token = tokenFromQuery || getToken(scanId);

    const res = await fetch(`/api/scans/get?scanId=${encodeURIComponent(scanId)}`, {
      method: "GET",
      headers: { accept: "application/json", ...(token ? { "x-scan-token": token } : {}) },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`scan_load_failed_${res.status}`);
    const data = (await res.json()) as ScanRecord;
    setRecord(data);
    setLocalDiff(null);

    try {
      const key = "als_scanIds";
      const existing = JSON.parse(localStorage.getItem(key) || "[]") as string[];
      const next = Array.from(new Set([scanId, ...existing])).slice(0, 20);
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // ignore
    }

    return data;
  }

  useEffect(() => {
    const prefillUrl = searchParams.get("url");
    const prefillTier = searchParams.get("prefillTier");
    const scanId = searchParams.get("scanId");
    const token = searchParams.get("token");

    if (prefillTier) setTier(prefillTier);

    // Persist token from redirect (Stripe success/cancel) if present.
    if (scanId && token) setToken(scanId, token);

    if (prefillUrl) {
      setUrl(prefillUrl);
      // Auto-scan if URL is prefilled
      runScan(prefillUrl);
      return;
    }

    if (scanId) {
      // Returned from Stripe (success/canceled) or deep-link.
      setBusy(true);

      const success = searchParams.get("success");

      // Localhost-friendly: if we have success=1, verify via Stripe API (no webhook required).
      const verify = async () => {
        if (success !== "1") return;
        await fetch("/api/stripe/verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ scanId }),
        }).catch(() => {});
      };

      verify()
        .then(() => fetchRecord(scanId))
        .catch((e) => console.error(e))
        .finally(() => setBusy(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    // Fallback: compute diff client-side if server didn't provide it.
    async function computeDiff() {
      if (!record?.isPaid) return;
      if (record.diffSummary) return;
      if (!record.previousScanId) return;

      const prevId = record.previousScanId;
      const prevToken = getToken(prevId);
      const curToken = getToken(record.scanId);
      if (!prevToken || !curToken) return;

      try {
        const prevRes = await fetch(`/api/scans/get?scanId=${encodeURIComponent(prevId)}`, {
          headers: { accept: "application/json", "x-scan-token": prevToken },
          cache: "no-store",
        });
        if (!prevRes.ok) return;
        const prev = (await prevRes.json()) as ScanRecord;

        const prevFindings = Array.isArray(prev.findings) ? (prev.findings as unknown[]) : [];
        const curFindings = Array.isArray(record.findings) ? (record.findings as unknown[]) : [];

        const key = (f: unknown) => {
          const o = (typeof f === "object" && f !== null ? (f as Record<string, unknown>) : {}) as Record<string, unknown>;
          return [o.ruleId, o.pageUrl, o.selector].map((x) => String(x || "")).join("|");
        };
        const prevSet = new Set(prevFindings.map(key));
        const curSet = new Set(curFindings.map(key));

        let persisting = 0;
        for (const k of curSet) if (prevSet.has(k)) persisting++;
        let fixed = 0;
        for (const k of prevSet) if (!curSet.has(k)) fixed++;
        let added = 0;
        for (const k of curSet) if (!prevSet.has(k)) added++;

        setLocalDiff({ fixed, new: added, persisting });
      } catch {
        // ignore
      }
    }

    computeDiff();
  }, [record]);

  const tiers = useMemo(
    () => [
      { id: "mini", label: "€29 Mini", desc: "Bis 5 Seiten" },
      { id: "standard", label: "€59 Standard", desc: "Bis 15 Seiten" },
      { id: "plus", label: "€99 Plus", desc: "Bis 50 Seiten" },
    ],
    []
  );

  function recommendTierFromUrl(u?: string | null) {
    const s = String(u || "").toLowerCase();
    if (!s) return "mini";

    // Heuristic: if it looks like commerce or conversion-heavy flows → Plus.
    const shopHints = [
      "shop",
      "checkout",
      "warenkorb",
      "cart",
      "produkt",
      "product",
      "kasse",
      "zahlung",
      "payment",
      "order",
      "bestellen",
      "buchung",
      "booking",
      "termin",
      "pricing",
      "plans",
    ];
    if (shopHints.some((h) => s.includes(h))) return "plus";

    // If user is just checking a single public homepage/news site, Standard is a safe default.
    // Mini remains for people who explicitly want a 1-page snapshot.
    return "standard";
  }

  const recommendedTier = useMemo(() => {
    // Prefer the URL we actually scanned (teaser/record) otherwise use the current input.
    const u = record?.url || teaser?.url || url;
    return recommendTierFromUrl(u);
  }, [record?.url, teaser?.url, url]);

  const selectedTier = tiers.find((t) => t.id === tier) ?? tiers[0];
  const priceText = (selectedTier.label.split(" ")[0] || "€29").trim();

  async function runScan(targetUrl?: string) {
    const scanUrlRaw = targetUrl || url;
    const scanUrl = normalizeUrl(scanUrlRaw);
    if (!isValidHttpUrl(scanUrl)) {
      alert("Bitte eine gültige URL oder Domain eingeben (z.B. welt.de oder https://welt.de).");
      return;
    }

    if (!authorizedToScan) {
      alert("Bitte bestätige, dass du berechtigt bist, diese Website zu scannen.");
      return;
    }

    setBusy(true);
    setTeaser(null);
    setLiveProgress(null);
    setLiveStep("Vorbereitung…");
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: scanUrl, authorizedToScan: true }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 429) {
          alert("Zu viele Scans. Bitte kurz warten und erneut versuchen.");
        } else {
          alert(`Scan fehlgeschlagen: ${err?.error || res.status}`);
        }
        return;
      }

      const started = (await res.json()) as {
        jobId: string;
        scanId: string;
        scanToken: string;
        discoveredPages?: number;
        recommendedTier?: string;
      };
      setToken(started.scanId, started.scanToken);
      setRecord(null);
      setDiscoveredPages(typeof started.discoveredPages === "number" ? started.discoveredPages : null);
      if (started.recommendedTier && ["mini", "standard", "plus"].includes(started.recommendedTier)) {
        setTier(started.recommendedTier);
      }

      // Poll job status until it completes.
      for (let i = 0; i < 180; i++) {
        await new Promise((r) => setTimeout(r, 900));
        const sres = await fetch(`/api/scan/status?jobId=${encodeURIComponent(started.jobId)}`, { cache: "no-store" });
        const sdata = (await sres.json()) as any;

        const p = sdata?.progress;
        if (p && typeof p.pagesDone === "number" && typeof p.pagesTotal === "number") {
          setLiveProgress({ pagesDone: p.pagesDone, pagesTotal: p.pagesTotal });
          if (p.pagesTotal > 1) {
            setLiveStep(`Scanne Seiten… (${p.pagesDone}/${p.pagesTotal})`);
          } else {
            setLiveStep(`Scanne… (${p.pagesDone}/${p.pagesTotal})`);
          }
        } else {
          // Fall back to generic messaging based on job/scan status.
          if (sdata?.status === "RUNNING" || sdata?.scanStatus === "RUNNING") setLiveStep("Scanne…");
          else if (sdata?.status === "QUEUED") setLiveStep("In Warteschlange…");
        }

        if (sdata?.status === "DONE") { 
          const teaserData: Teaser = {
            scanId: sdata.scanId,
            scanToken: started.scanToken,
            url: sdata.url,
            totals: sdata.totals,
            sampleFinding: sdata.sampleFinding,
            pdfUrl: sdata.pdfUrl,
            limits: { findingsReturned: sdata?.totals?.total ?? 0, note: "" },
          } as any;

          setTeaser(teaserData);

          try {
            const key = "als_scanIds";
            const existing = JSON.parse(localStorage.getItem(key) || "[]") as string[];
            const next = Array.from(new Set([teaserData.scanId, ...existing])).slice(0, 20);
            localStorage.setItem(key, JSON.stringify(next));
          } catch {
            // ignore
          }

          return;
        }

        if (sdata?.status === "FAILED") {
          alert(`Scan fehlgeschlagen: ${sdata?.error || "FAILED"}`);
          return;
        }
      }

      alert("Scan dauert zu lange (Timeout). Bitte später erneut versuchen.");
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  async function unlock() {
    const scanId = record?.scanId || teaser?.scanId;
    if (!scanId) return;

    const token = getToken(scanId);

    // If already paid, just open the PDF.
    if (record?.isPaid) {
      const pdfUrl = `/api/report/pdf?scanId=${encodeURIComponent(record.scanId)}&token=${encodeURIComponent(token)}`;
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (!teaser) return;

    // Require Google login before Stripe checkout
    if (authStatus !== "authenticated") {
      await signIn("google", { callbackUrl: window.location.href });
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scanId: teaser.scanId, tier, scanToken: token }),
      });

      if (res.status === 401) {
        await signIn("google", { callbackUrl: window.location.href });
        return;
      }

      const data = (await res.json()) as { url?: string; error?: string };
      if (!data.url) throw new Error(data.error || "checkout_failed");
      window.location.href = data.url;
    } catch (e) {
      console.error(e);
      alert("Checkout konnte nicht gestartet werden.");
    } finally {
      setBusy(false);
    }
  }

  async function rerunPaidScan() {
    alert("Re-Scan ist aktuell deaktiviert. Für einen neuen Scan bitte einen neuen Check starten.");
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">Teaser-Scan</h1>
        <p className="text-muted-foreground text-lg">
          Sofortige Analyse deiner Website auf Barrierefreiheit.
        </p>
      </div>

      <div className="glass rounded-[2rem] p-8 border border-slate-200 shadow-2xl">
        <label className="block text-sm font-semibold mb-3 text-slate-600">Website URL zum Scannen</label>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 bg-white border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-900 placeholder-slate-400"
            placeholder="https://deine-website.de"
          />
          <button
            onClick={() => runScan()}
            disabled={busy || !url.startsWith("http")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold transition-all disabled:opacity-50 whitespace-nowrap shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
          >
            {busy ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Analysiere...
              </span>
            ) : "Scan starten"}
          </button>
        </div>

        <label className="mt-4 flex items-start gap-3 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={authorizedToScan}
            onChange={(e) => setAuthorizedToScan(e.target.checked)}
            className="mt-1"
          />
          <span>
            Ich bestätige, dass ich berechtigt bin, diese Website zu scannen (z.B. Eigentümer:in, Admin oder ausdrückliche Zustimmung).
            <span className="block text-[11px] text-slate-500 mt-1">
              Hinweis: Technischer Check nach WCAG/EN 301 549/BITV. Keine Rechtsberatung. Keine Gewähr/Haftung für Vollständigkeit oder BFSG-/WCAG-Konformität; automatisierte Checks finden nicht alle Barrieren (manuelle Prüfung empfohlen).
            </span>
          </span>
        </label>

        {busy && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-slate-700">{liveStep || "Scanne…"}</div>
              {discoveredPages !== null && (
                <div className="text-xs text-slate-600">Gefunden: ~{discoveredPages} Seiten</div>
              )}
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{
                  width:
                    liveProgress && liveProgress.pagesTotal
                      ? `${Math.min(100, Math.round((100 * liveProgress.pagesDone) / Math.max(1, liveProgress.pagesTotal)))}%`
                      : "18%",
                }}
              />
            </div>

            {liveProgress && (
              <div className="mt-2 text-xs text-slate-600">
                {liveProgress.pagesDone}/{liveProgress.pagesTotal} Seiten
              </div>
            )}
          </div>
        )}
      </div>

      {(teaser || record) && (
        <div className="mt-8 animate-fade-in">
          <div className="glass rounded-[2rem] overflow-hidden border border-slate-200 shadow-2xl">
            <div className="p-8 border-b border-slate-100">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-sm font-semibold text-blue-600 mb-1 uppercase tracking-wider">Ergebnis für</div>
                  <div className="text-xl font-bold truncate max-w-md text-slate-900">{(record?.url || teaser?.url) ?? ""}</div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-slate-900">{(record?.totals?.total ?? teaser?.totals.total) ?? 0}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Probleme</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { l: "P0 Critical", v: (record?.totals?.p0 ?? teaser?.totals.p0) ?? 0, c: "bg-red-50 text-red-600 border-red-100" },
                  { l: "P1 High", v: (record?.totals?.p1 ?? teaser?.totals.p1) ?? 0, c: "bg-orange-50 text-orange-600 border-orange-100" },
                  { l: "P2 Medium", v: (record?.totals?.p2 ?? teaser?.totals.p2) ?? 0, c: "bg-yellow-50 text-yellow-600 border-yellow-100" },
                ].map((stat) => (
                  <div key={stat.l} className={`p-4 rounded-2xl border ${stat.c}`}>
                    <div className="text-2xl font-bold">{stat.v}</div>
                    <div className="text-[10px] uppercase font-bold opacity-80">{stat.l}</div>
                  </div>
                ))}
              </div>

              {record?.isPaid && (
                <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-bold">
                  Freigeschaltet · Zugriff aktiv
                </div>
              )}

              {record?.isPaid && (record.tier ?? "mini") === "plus" && (
                <div className="mt-3 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl p-3">
                  Re-Scan Vergleich:{" "}
                  {record?.diffSummary || localDiff ? (
                    <>
                      {(record?.diffSummary ?? localDiff)!.fixed} gefixt · {(record?.diffSummary ?? localDiff)!.new} neu · {(record?.diffSummary ?? localDiff)!.persisting} noch offen
                    </>
                  ) : (
                    <span className="text-slate-500">wird berechnet…</span>
                  )}
                </div>
              )}

              {!record?.isPaid && record?.status && record.status !== "SUCCEEDED" && (
                <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                  Status: {record.status}
                  {record.progress ? ` · ${record.progress.pagesDone}/${record.progress.pagesTotal}` : ""}
                </div>
              )}

              {record?.error && (
                <div className="mt-4 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                  Fehler: {record.error}
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-50/50">
              {(record?.sampleFinding || teaser?.sampleFinding) && (
                <>
                  <div className="text-sm font-bold text-slate-500 mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    VORSCHAU-FINDING (1 von {(record?.totals?.total ?? teaser?.totals.total) ?? 0})
                  </div>
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black ${severityBadge(
                          (record?.sampleFinding?.severity ?? teaser?.sampleFinding.severity) as "P0" | "P1" | "P2"
                        )}`}
                      >
                        {(record?.sampleFinding?.severity ?? teaser?.sampleFinding.severity) as "P0" | "P1" | "P2"}
                      </span>
                      <h3 className="font-bold text-slate-900">{record?.sampleFinding?.title ?? teaser?.sampleFinding.title}</h3>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{record?.sampleFinding?.hint ?? teaser?.sampleFinding.hint}</p>
                  </div>
                </>
              )}

              {record?.isPaid && Array.isArray(record.findings) && record.findings.length > 0 && (
                <div className="mt-10">
                  <div className="flex items-end justify-between gap-4 mb-4">
                    <div>
                      <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Vollreport</div>
                      <h4 className="text-2xl font-black text-slate-900">Priorisierte Findings (P0–P2)</h4>
                    </div>
                    <div className="hidden md:flex items-center gap-2">
                      <button
                        onClick={unlock}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold"
                      >
                        PDF öffnen
                      </button>
                      {/* Re-Scan disabled */}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {(record.findings as Finding[]).map((f, idx) => (
                      <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${severityBadge(f.severity)}`}>{f.severity}</span>
                          <div className="font-extrabold text-slate-900">{(f.title || f.ruleId) ? (translateFinding(f).title || f.ruleId) : "Befund"}</div>
                        </div>

                        {translateFinding(f).description && <p className="text-sm text-slate-700 leading-relaxed mb-3">{translateFinding(f).description}</p>}

                        {(f.selector || f.snippet) && (
                          <details className="mb-3">
                            <summary className="cursor-pointer text-xs font-bold text-slate-600 uppercase tracking-wider">
                              Technische Details
                            </summary>
                            <div className="mt-2 space-y-2">
                              {f.selector && (
                                <div>
                                  <div className="text-[10px] font-bold text-slate-500 uppercase">Selektor</div>
                                  <code className="block text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 overflow-x-auto">{f.selector}</code>
                                </div>
                              )}
                              {f.pageUrl && (
                                <div>
                                  <div className="text-[10px] font-bold text-slate-500 uppercase">URL</div>
                                  <div className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 overflow-x-auto">{f.pageUrl}</div>
                                </div>
                              )}
                              {f.capturedAt && (
                                <div>
                                  <div className="text-[10px] font-bold text-slate-500 uppercase">Zeitpunkt</div>
                                  <div className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 overflow-x-auto">{f.capturedAt}</div>
                                </div>
                              )}
                              {f.snippet && (
                                <div>
                                  <div className="text-[10px] font-bold text-slate-500 uppercase">Snippet</div>
                                  <pre className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap">{f.snippet}</pre>
                                </div>
                              )}
                              {f.failureSummary && (
                                <div>
                                  <div className="text-[10px] font-bold text-slate-500 uppercase">Fehlerbeschreibung</div>
                                  <pre className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap">{translateFinding(f).failureSummary}</pre>

                                  {translateFinding(f).originalFailureSummary && translateFinding(f).originalFailureSummary !== translateFinding(f).failureSummary && (
                                    <details className="mt-2">
                                      <summary className="cursor-pointer text-[10px] font-bold text-slate-500 uppercase">Original (EN)</summary>
                                      <pre className="mt-2 text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap">{translateFinding(f).originalFailureSummary}</pre>
                                    </details>
                                  )}
                                </div>
                              )}
                            </div>
                          </details>
                        )}

                        {Array.isArray(f.fixSteps) && f.fixSteps.length > 0 && (
                          <div className="mt-3">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Fix-Rezept</div>
                            <ol className="list-decimal pl-5 space-y-1 text-sm text-slate-700">
                              {f.fixSteps.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {f.helpUrl && (
                          <div className="mt-4">
                            <a
                              href={f.helpUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-bold text-blue-700 hover:text-blue-800"
                            >
                              Regel/Referenz öffnen
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-10">
                {/* Kurzcheck-Summary + CTA */}
                {!!teaser && (
                  <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="text-center">
                      <h4 className="text-2xl font-black tracking-tight">
                        Dein Kurzcheck: <span className="text-blue-700">{teaser.totals.total}</span> Issues gefunden
                      </h4>
                      <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-700">P0 {teaser.totals.p0}</span>
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-orange-100 text-orange-700">P1 {teaser.totals.p1}</span>
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-yellow-100 text-yellow-800">P2 {teaser.totals.p2}</span>
                      </div>
                    </div>

                    {/* Top-Risiko */}
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Top-Risiko</div>
                      <div className="font-extrabold text-slate-900">
                        Kritisch ({teaser.sampleFinding.severity}): {teaser.sampleFinding.title}
                      </div>
                      <div className="text-sm text-slate-700 mt-1">Impact: {teaser.sampleFinding.hint}</div>
                    </div>

                    {/* CTA */}
                    <div className="mt-6">
                      <button
                        onClick={unlock}
                        disabled={busy}
                        className="w-full bg-slate-900 text-white hover:bg-slate-800 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 uppercase tracking-tight shadow-xl disabled:opacity-50"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3" />
                        </svg>
                        {record?.isPaid
                          ? "PDF öffnen"
                          : authStatus === "authenticated"
                            ? "Jetzt Report freischalten"
                            : "Weiter mit Google (Report freischalten)"}
                      </button>

                      {!record?.isPaid && (
                        <p className="mt-3 text-xs text-center text-slate-600">
                          Danach einmalig <span className="font-extrabold text-slate-900">{priceText}</span> · PDF sofort · kein Abo
                        </p>
                      )}

                      {!record?.isPaid && (
                        <div className="mt-5">
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 text-center">Im Report enthalten</div>
                          <ul className="text-sm text-slate-700 space-y-1 list-disc pl-5 max-w-md mx-auto">
                            <li>Alle Findings mit Priorität</li>
                            <li>Konkrete Fix-Anleitungen</li>
                            <li>PDF als technischer Prüfbericht (kein Rechtsgutachten)</li>
                          </ul>

                          <details className="mt-4 max-w-md mx-auto">
                            <summary className="cursor-pointer text-xs font-bold text-slate-600">Warum Google Login?</summary>
                            <div className="mt-2 text-xs text-slate-600">
                              Nur zur Zuordnung von Kauf &amp; Download. Kein Newsletter, kein Abo.
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Plan-Auswahl (optional) */}
                {!record?.isPaid && (
                  <>
                    <div className="text-center mb-4">
                      <p className="text-sm text-muted-foreground">Plan wählen (Preis &amp; Scan-Umfang):</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                      {tiers.map((t) => {
                        const isRec = t.id === recommendedTier;
                        return (
                          <button
                            key={t.id}
                            onClick={() => setTier(t.id)}
                            className={`text-left p-4 rounded-2xl border transition-all relative ${
                              tier === t.id
                                ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-blue-200 hover:text-slate-900"
                            }`}
                          >
                            {isRec && (
                              <span
                                className={`absolute -top-2 right-3 px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                  tier === t.id
                                    ? "bg-white/15 text-white border-white/30"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                }`}
                              >
                                Empfohlen
                              </span>
                            )}
                            <div className="font-bold">{t.label}</div>
                            <div className="text-[10px] opacity-80 uppercase font-bold mt-1">{t.desc}</div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="max-w-md mx-auto text-xs text-slate-600 bg-white border border-slate-200 rounded-2xl p-4">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 text-center">Welches Paket passt?</div>
                      <ul className="space-y-1 list-disc pl-5">
                        <li><b>Mini</b>: 1 Seite (Landingpage/Startseite) – schnelle Einschätzung.</li>
                        <li><b>Standard</b>: bis 10 wichtige Seiten (z.B. Start, Kontakt, Checkout, Formular, Produkt/Leistung).</li>
                        <li><b>Plus</b>: bis 50 Seiten (repräsentativ) – besser für Shops, größere Sites und mehrere Templates.</li>
                      </ul>
                      <div className="mt-3 text-[11px] text-slate-500">
                        Vorschlag basiert auf URL/Seiten-Typ (Heuristik). Du kannst jederzeit umstellen.
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScanPage() {
  return (
    <main className="min-h-screen bg-background text-foreground hero-gradient selection:bg-blue-500/30 pt-32 pb-20 px-6">
      <nav className="fixed top-0 w-full z-50 border-b border-slate-200/60 glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <BrandMark />
          <div className="flex items-center gap-4">
            <AuthNav />
            <Link href="/" className="text-sm font-medium text-slate-600 hover:text-blue-600 Transition flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Zurück
            </Link>
          </div>
        </div>
      </nav>

      <Suspense fallback={<div className="text-center py-20">Lade Scan...</div>}>
         <ScanContent />
      </Suspense>
    </main>
  );
}
