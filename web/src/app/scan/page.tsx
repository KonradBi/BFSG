"use client";

import { useMemo, useState, useEffect, useRef, Suspense } from "react";
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
  limits?: { findingsReturned: number; note: string };
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
  // screenshotDataUrl disabled (keeps payload small + avoids PDF rendering issues)

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

  // PERF: keep the URL input responsive by avoiding a full React re-render on every keystroke.
  // Store the draft value in a ref (uncontrolled input) and only commit to state when starting a scan.
  const urlDraftRef = useRef<string>("");
  const [urlSeed, setUrlSeed] = useState("");
  const [url, setUrl] = useState("");

  const [busy, setBusy] = useState(false);
  const [teaser, setTeaser] = useState<Teaser | null>(null);
  const [discoveredPages, setDiscoveredPages] = useState<number | null>(null);
  const [liveProgress, setLiveProgress] = useState<{ pagesDone: number; pagesTotal: number } | null>(null);
  const [liveStep, setLiveStep] = useState<string>("");
  // Default to the cheapest plan; we can show a recommendation separately.
  const [tier, setTier] = useState("mini");
  // Invoice creation is always enabled (UI does not expose a checkbox).
  const wantInvoice = true;
  const [record, setRecord] = useState<ScanRecord | null>(null);
  const [authorizedToScan, setAuthorizedToScan] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [ackNoLegalAdvice, setAckNoLegalAdvice] = useState(false);
  const [authorizedToScanError, setAuthorizedToScanError] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const scanInFlightRef = useRef(false);
  const cooldownUntilRef = useRef(0);
  const urlInputElRef = useRef<HTMLInputElement | null>(null);

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

    // Persist token from redirect (Stripe success/cancel) or auth callback if present.
    if (scanId && token) {
      setToken(scanId, token);
      if (typeof window !== "undefined") {
        const next = new URL(window.location.href);
        if (next.searchParams.has("token")) {
          next.searchParams.delete("token");
          window.history.replaceState({}, "", next.toString());
        }
      }
    }

    if (prefillUrl) {
      urlDraftRef.current = prefillUrl;
      setUrlSeed(prefillUrl);
      setUrl(prefillUrl);
      // Auto-scan if URL is prefilled
      runScan(prefillUrl);
      return;
    }

    if (scanId) {
      // Returned from Stripe (success/canceled) or deep-link or auth callback.
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

  type TierOption = {
    id: "mini" | "standard" | "plus";
    label: string;
    desc: string;
    price: number;
    compareAt: number;
  };

  const tiers = useMemo<TierOption[]>(
    () => [
      { id: "mini", label: "Mini", desc: "Bis 5 Seiten", price: 29, compareAt: 49 },
      { id: "standard", label: "Standard", desc: "Bis 15 Seiten", price: 59, compareAt: 99 },
      { id: "plus", label: "Plus", desc: "Bis 50 Seiten", price: 99, compareAt: 149 },
    ],
    []
  );

  function recommendTierFromUrl(u?: string | null) {
    const s = String(u || "").toLowerCase();
    if (!s) return "standard";

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

    return "standard";
  }

  function recommendTierFromPages(pages: number | null | undefined) {
    const n = typeof pages === "number" && Number.isFinite(pages) ? pages : null;
    if (!n) return null;
    if (n <= 5) return "mini";
    if (n <= 15) return "standard";
    return "plus";
  }

  const estimatedPages = useMemo(() => {
    // Prefer the scanner's own discovery/progress numbers.
    return (
      discoveredPages ??
      liveProgress?.pagesTotal ??
      record?.progress?.pagesTotal ??
      null
    );
  }, [discoveredPages, liveProgress?.pagesTotal, record?.progress?.pagesTotal]);

  const recommendedTier = useMemo(() => {
    const byPages = recommendTierFromPages(estimatedPages);
    if (byPages) return byPages;

    // Fallback: URL heuristic.
    const u = record?.url || teaser?.url || url;
    return recommendTierFromUrl(u);
  }, [estimatedPages, record?.url, teaser?.url, url]);

  const selectedTier = tiers.find((t) => t.id === tier) ?? tiers[0];
  const priceText = `€${selectedTier.price}`;
  const compareAtText = `€${selectedTier.compareAt}`;
  const savings = Math.max(0, selectedTier.compareAt - selectedTier.price);
  const summaryTotals = record?.totals ?? teaser?.totals ?? null;
  const nextSteps = useMemo(() => {
    const totals = summaryTotals ?? { p0: 0, p1: 0, p2: 0, total: 0 };
    return [
      totals.p0
        ? `P0 priorisieren: ${totals.p0} kritische Befunde innerhalb von 24–72h beheben.`
        : "Keine P0-Befunde (kritisch) gefunden.",
      totals.p1
        ? `P1 einplanen: ${totals.p1} wichtige Befunde zeitnah beheben.`
        : "Keine P1-Befunde (hoch) gefunden.",
      totals.total
        ? "Nach Behebungen: erneuten Scan durchführen und Änderungen verifizieren."
        : "Nach dem Scan: erste Fixes sammeln und erneut prüfen.",
    ];
  }, [summaryTotals]);

  const issueRows = useMemo(() => {
    const order: Record<Finding["severity"], number> = { P0: 0, P1: 1, P2: 2 };
    if (record?.isPaid && Array.isArray(record.findings)) {
      const list = [...(record.findings as Finding[])];
      return list
        .sort((a, b) => order[a.severity] - order[b.severity])
        .slice(0, 8)
        .map((f) => ({
          severity: f.severity,
          title: translateFinding(f).title || f.ruleId || "Befund",
          pageUrl: f.pageUrl || record.url || teaser?.url || "",
        }));
    }
    const sample = record?.sampleFinding ?? teaser?.sampleFinding;
    if (sample) {
      return [
        {
          severity: sample.severity,
          title: sample.title,
          pageUrl: record?.url || teaser?.url || "",
        },
      ];
    }
    return [];
  }, [record?.isPaid, record?.findings, record?.sampleFinding, record?.url, teaser?.sampleFinding, teaser?.url]);

  useEffect(() => {
    // Sync URL ref from the actual input element (important when the browser restores form state on back/forward navigation).
    const domValue = urlInputElRef.current?.value;
    if (domValue) urlDraftRef.current = domValue;
  }, [urlSeed]);

  useEffect(() => {
    if (!cooldownUntil) {
      setCooldownRemaining(0);
      return;
    }

    const updateRemaining = () => {
      const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownRemaining(remaining);
      if (remaining <= 0) {
        cooldownUntilRef.current = 0;
        setCooldownUntil(0);
      }
    };

    updateRemaining();
    const timer = window.setInterval(updateRemaining, 250);
    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  const groupedFindings = useMemo(() => {
    if (!record?.isPaid || !Array.isArray(record.findings)) {
      return { P0: [], P1: [], P2: [] } as Record<"P0" | "P1" | "P2", Finding[]>;
    }
    const list = record.findings as Finding[];
    return {
      P0: list.filter((f) => f.severity === "P0"),
      P1: list.filter((f) => f.severity === "P1"),
      P2: list.filter((f) => f.severity === "P2"),
    };
  }, [record?.isPaid, record?.findings]);

  async function runScan(targetUrl?: string) {
    if (scanInFlightRef.current) return;
    if (cooldownUntilRef.current && cooldownUntilRef.current > Date.now()) return;

    const scanUrlRaw = String(targetUrl ?? urlInputElRef.current?.value ?? urlDraftRef.current ?? urlSeed ?? url).trim();
    const scanUrl = normalizeUrl(scanUrlRaw);

    // Commit URL state only when we actually start work.
    setUrl(scanUrlRaw);
    setUrlSeed(scanUrlRaw);
    urlDraftRef.current = scanUrlRaw;
    if (!isValidHttpUrl(scanUrl)) {
      alert("Bitte eine gültige URL oder Domain eingeben (z.B. welt.de oder https://welt.de).");
      return;
    }

    if (!authorizedToScan) {
      setAuthorizedToScanError(true);
      return;
    }
    if (!acceptedTerms || !ackNoLegalAdvice) {
      setTermsError(true);
      return;
    }

    scanInFlightRef.current = true;
    setIsScanning(true);
    const cooldownTarget = Date.now() + 5_000;
    cooldownUntilRef.current = cooldownTarget;
    setCooldownUntil(cooldownTarget);

    setBusy(true);
    setTeaser(null);
    setRecord(null);
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
        const sdata = (await sres.json()) as unknown as {
          status?: string;
          scanStatus?: string;
          scanId?: string;
          url?: string;
          totals?: Teaser["totals"];
          sampleFinding?: Teaser["sampleFinding"];
          pdfUrl?: string;
          error?: string;
          progress?: { pagesDone: number; pagesTotal: number };
        };

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
            scanId: sdata.scanId || "",
            scanToken: started.scanToken,
            url: sdata.url || "",
            totals: sdata.totals || { p0: 0, p1: 0, p2: 0, total: 0 },
            sampleFinding: sdata.sampleFinding || {
              title: "Befund",
              severity: "P2",
              hint: "",
            },
            pdfUrl: sdata.pdfUrl,
            limits: { findingsReturned: sdata?.totals?.total ?? 0, note: "" },
          };

          setTeaser(teaserData);

          // Make the teaser shareable/reload-safe: persist scanId (+ token) into the URL.
          // This prevents losing the "Jetzt Report freischalten" CTA after back/refresh.
          try {
            const u = new URL(window.location.href);
            u.searchParams.set("scanId", teaserData.scanId);
            u.searchParams.set("token", started.scanToken);
            window.history.replaceState({}, "", u.toString());
          } catch {
            // ignore
          }

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
      scanInFlightRef.current = false;
      setIsScanning(false);
    }
  }

  function getPendingCheckout(): { scanId: string; tier: string; invoice?: boolean } | null {
    try {
      const raw = localStorage.getItem("als_pendingCheckout");
      if (!raw) return null;
      const data = JSON.parse(raw) as { scanId?: string; tier?: string; invoice?: boolean; ts?: number };
      if (!data?.scanId) return null;
      // Auto-expire after 30 minutes.
      if (data.ts && Date.now() - data.ts > 30 * 60 * 1000) {
        localStorage.removeItem("als_pendingCheckout");
        return null;
      }
      return { scanId: String(data.scanId), tier: String(data.tier || "mini"), invoice: Boolean(data.invoice) };
    } catch {
      return null;
    }
  }

  function setPendingCheckout(scanId: string, tier: string, invoice?: boolean) {
    try {
      localStorage.setItem("als_pendingCheckout", JSON.stringify({ scanId, tier, invoice: Boolean(invoice), ts: Date.now() }));
    } catch {
      // ignore
    }
  }

  function clearPendingCheckout() {
    try {
      localStorage.removeItem("als_pendingCheckout");
    } catch {
      // ignore
    }
  }

  async function startCheckout(scanId: string, effectiveTier: string, invoice?: boolean) {
    const token = getToken(scanId);
    setBusy(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scanId, tier: effectiveTier, scanToken: token, invoice: Boolean(invoice) }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
        stripeMessage?: string;
        stripeType?: string;
        stripeCode?: string;
        requestId?: string;
      };

      if (res.status === 401) {
        // Not logged in / session not ready. Resume after Google login.
        setPendingCheckout(scanId, effectiveTier, invoice);
        await signIn("google", {
          callbackUrl: `/scan?scanId=${encodeURIComponent(scanId)}&token=${encodeURIComponent(token)}&prefillTier=${encodeURIComponent(
            effectiveTier
          )}`,
        });
        return;
      }

      if (!res.ok) {
        const extra = [
          data.error,
          `http:${res.status}`,
          data.stripeCode ? `stripe:${data.stripeCode}` : "",
          data.stripeType ? `type:${data.stripeType}` : "",
          data.requestId ? `req:${data.requestId}` : "",
          data.stripeMessage ? data.stripeMessage : "",
        ]
          .filter(Boolean)
          .join(" | ");

        throw new Error(extra || `checkout_failed_${res.status}`);
      }

      if (!data.url) throw new Error(data.error || "checkout_failed");
      clearPendingCheckout();
      window.location.href = data.url;
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      alert(`Checkout konnte nicht gestartet werden (${msg}).`);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    // After Google login, resume the checkout automatically (prevents "landing back" on /scan).
    if (authStatus !== "authenticated") return;
    if (!record?.scanId) return;
    if (record.isPaid) {
      clearPendingCheckout();
      return;
    }

    const pending = getPendingCheckout();
    if (!pending) return;
    if (pending.scanId !== record.scanId) return;

    // Sync tier from pending (in case state reset during redirect).
    if (pending.tier && pending.tier !== tier) setTier(pending.tier);

    // Fire & forget; it will redirect to Stripe.
    startCheckout(record.scanId, pending.tier || tier, pending.invoice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, record?.scanId]);

  async function unlock() {
    const scanId = record?.scanId || teaser?.scanId;
    if (!scanId) return;

    const token = getToken(scanId);

    // If already paid, just open the PDF.
    if (record?.isPaid) {
      const pdfUrl = `/api/report/pdf?scanId=${encodeURIComponent(record.scanId)}&token=${encodeURIComponent(token)}`;
      // Some browsers block window.open; fall back to same-tab navigation so the user always gets a result.
      const win = window.open(pdfUrl, "_blank", "noopener,noreferrer");
      if (!win) window.location.href = pdfUrl;
      return;
    }

    // Require Google login before Stripe checkout
    if (authStatus !== "authenticated") {
      setPendingCheckout(scanId, tier, wantInvoice);
      await signIn("google", {
        callbackUrl: `/scan?scanId=${encodeURIComponent(scanId)}&token=${encodeURIComponent(token)}&prefillTier=${encodeURIComponent(tier)}`,
      });
      return;
    }

    await startCheckout(scanId, tier, wantInvoice);
  }

  async function rerunPaidScan() {
    alert("Re-Scan ist aktuell deaktiviert. Für einen neuen Scan bitte einen neuen Check starten.");
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 md:mb-12 text-center">
        <h1 className="text-3xl md:text-5xl font-black mb-3 text-gradient tracking-tight">Teaser‑Scan</h1>
        <p className="text-muted-foreground text-base md:text-lg">
          Sofortige Analyse Ihrer Website auf Barrierefreiheit.
        </p>
      </div>

      <div className="glass rounded-3xl p-5 md:p-8 border border-slate-200 shadow-2xl">
        <label className="block text-sm font-semibold mb-3 text-slate-600">Website‑URL zum Scannen</label>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runScan(urlInputElRef.current?.value || urlDraftRef.current || urlSeed || url);
          }}
          className="flex flex-col md:flex-row gap-3"
        >
          <input
            key={urlSeed}
            ref={urlInputElRef}
            defaultValue={urlSeed}
            onChange={(e) => {
              urlDraftRef.current = e.target.value;
            }}
            className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 md:px-5 py-3.5 md:py-4 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-900 placeholder-slate-400"
            placeholder="https://ihre-website.de"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={(() => {
              const raw = String(urlInputElRef.current?.value || urlDraftRef.current || urlSeed || url).trim();
              const normalized = normalizeUrl(raw);
              return (
                busy ||
                isScanning ||
                cooldownRemaining > 0 ||
                !authorizedToScan ||
                !acceptedTerms ||
                !ackNoLegalAdvice ||
                !isValidHttpUrl(normalized)
              );
            })()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 md:px-8 py-3.5 md:py-4 rounded-2xl font-bold transition-all disabled:opacity-50 whitespace-nowrap shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
          >
            {busy ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Analysiere...
              </span>
            ) : "Scan starten"}
          </button>
        </form>
        {cooldownRemaining > 0 && (
          <div className="mt-2 text-xs text-slate-500">
            Bitte {cooldownRemaining}s warten, bevor Sie erneut scannen.
          </div>
        )}

        <label className="mt-4 flex items-start gap-3 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={authorizedToScan}
            onChange={(e) => {
              setAuthorizedToScan(e.target.checked);
              if (e.target.checked) setAuthorizedToScanError(false);
            }}
            className="mt-1"
          />
          <span>
            Ich bestätige, dass ich berechtigt bin, diese Website zu scannen (z.B. Eigentümer:in, Admin oder ausdrückliche Zustimmung).
          </span>
        </label>
        {authorizedToScanError && (
          <div className="mt-2 text-xs font-semibold text-red-600">
            Bitte bestätigen Sie vor dem Scan, dass Sie berechtigt sind, diese Website zu scannen.
          </div>
        )}

        <label className="mt-3 flex items-start gap-3 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => {
              setAcceptedTerms(e.target.checked);
              if (e.target.checked) setTermsError(false);
            }}
            className="mt-1"
          />
          <span>
            Ich akzeptiere die <Link href="/agb" className="font-bold text-blue-700 hover:text-blue-800">AGB</Link> und die{" "}
            <Link href="/datenschutz" className="font-bold text-blue-700 hover:text-blue-800">Datenschutzerklärung</Link>.
          </span>
        </label>

        <label className="mt-3 flex items-start gap-3 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={ackNoLegalAdvice}
            onChange={(e) => {
              setAckNoLegalAdvice(e.target.checked);
              if (e.target.checked) setTermsError(false);
            }}
            className="mt-1"
          />
          <span>
            Mir ist bewusst: Der Scan ist eine <strong>technische</strong> Analyse und <strong>keine Rechtsberatung</strong>. Ergebnisse ohne Gewähr auf Vollständigkeit;
            automatisierte Checks finden nicht alle Barrieren (manuelle Prüfung empfohlen).
          </span>
        </label>

        {termsError && (
          <div className="mt-2 text-xs font-semibold text-red-600">
            Bitte bestätigen Sie AGB/Datenschutz und den Haftungs-/Rechtsberatungshinweis, bevor Sie scannen.
          </div>
        )}

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
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Befunde</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { l: "P0 (kritisch)", v: (record?.totals?.p0 ?? teaser?.totals.p0) ?? 0, c: "bg-red-50 text-red-600 border-red-100" },
                  { l: "P1 (hoch)", v: (record?.totals?.p1 ?? teaser?.totals.p1) ?? 0, c: "bg-orange-50 text-orange-600 border-orange-100" },
                  { l: "P2 (mittel)", v: (record?.totals?.p2 ?? teaser?.totals.p2) ?? 0, c: "bg-yellow-50 text-yellow-600 border-yellow-100" },
                ].map((stat) => (
                  <div key={stat.l} className={`p-4 rounded-2xl border ${stat.c}`}>
                    <div className="text-2xl font-black">{stat.v}</div>
                    <div className="text-[10px] uppercase font-bold opacity-80">{stat.l}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                {(() => {
                  const totals = record?.totals ?? teaser?.totals;
                  const p0 = totals?.p0 ?? 0;
                  const p1 = totals?.p1 ?? 0;
                  const p2 = totals?.p2 ?? 0;
                  const total = Math.max(1, (totals?.total ?? 0) || p0 + p1 + p2);
                  const w0 = Math.round((100 * p0) / total);
                  const w1 = Math.round((100 * p1) / total);
                  const w2 = Math.max(0, 100 - w0 - w1);
                  return (
                    <div className="h-2 w-full rounded-full overflow-hidden bg-slate-200 flex">
                      <div className="h-full bg-red-500" style={{ width: `${w0}%` }} />
                      <div className="h-full bg-orange-500" style={{ width: `${w1}%` }} />
                      <div className="h-full bg-yellow-400" style={{ width: `${w2}%` }} />
                    </div>
                  );
                })()}
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
              <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr] mb-8">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Report Summary</div>
                      <h3 className="text-xl font-black text-slate-900">Kompakte Übersicht</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-slate-900">{summaryTotals?.total ?? 0}</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Befunde</div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { l: "P0", v: summaryTotals?.p0 ?? 0, c: "bg-red-50 text-red-700 border-red-100" },
                      { l: "P1", v: summaryTotals?.p1 ?? 0, c: "bg-orange-50 text-orange-700 border-orange-100" },
                      { l: "P2", v: summaryTotals?.p2 ?? 0, c: "bg-yellow-50 text-yellow-800 border-yellow-100" },
                      { l: "Gesamt", v: summaryTotals?.total ?? 0, c: "bg-slate-50 text-slate-700 border-slate-200" },
                    ].map((stat) => (
                      <div key={stat.l} className={`p-3 rounded-2xl border ${stat.c}`}>
                        <div className="text-xl font-black">{stat.v}</div>
                        <div className="text-[10px] uppercase font-bold opacity-80">{stat.l}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    {(() => {
                      const totals = summaryTotals ?? { p0: 0, p1: 0, p2: 0, total: 0 };
                      const total = Math.max(1, totals.total || totals.p0 + totals.p1 + totals.p2);
                      const w0 = Math.round((100 * totals.p0) / total);
                      const w1 = Math.round((100 * totals.p1) / total);
                      const w2 = Math.max(0, 100 - w0 - w1);
                      return (
                        <div className="h-2 w-full rounded-full overflow-hidden bg-slate-200 flex">
                          <div className="h-full bg-red-500" style={{ width: `${w0}%` }} />
                          <div className="h-full bg-orange-500" style={{ width: `${w1}%` }} />
                          <div className="h-full bg-yellow-400" style={{ width: `${w2}%` }} />
                        </div>
                      );
                    })()}
                  </div>

                  <div className="mt-5">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Next steps</div>
                    <ul className="text-sm text-slate-700 space-y-1 list-disc pl-5">
                      {nextSteps.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Issues</div>
                      <h3 className="text-xl font-black text-slate-900">Auffällige Befunde</h3>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{record?.isPaid ? "Top 8" : "Vorschau"}</span>
                  </div>

                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                    {issueRows.length ? (
                      issueRows.map((issue, idx) => (
                        <div key={`${issue.title}-${idx}`} className="flex items-center justify-between gap-3 p-3 bg-white">
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-900 truncate">{issue.title}</div>
                            <div className="text-xs text-slate-500 truncate">{issue.pageUrl || "—"}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${severityBadge(issue.severity)}`}>{issue.severity}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-sm text-slate-500">Noch keine Issues verfügbar.</div>
                    )}
                  </div>

                  {!record?.isPaid && (
                    <div className="mt-4 text-xs text-slate-500">
                      Vollständige Liste und Details im freigeschalteten Report.
                    </div>
                  )}
                </div>
              </div>

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
                        PDF‑Report öffnen
                      </button>
                      {/* Re-Scan disabled */}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {(["P0", "P1", "P2"] as const).map((sev) => {
                      const items = groupedFindings[sev];
                      if (!items.length) return null;
                      return (
                        <details key={sev} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden" open={sev === "P0"}>
                          <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${severityBadge(sev)}`}>{sev}</span>
                              <div className="font-extrabold text-slate-900">Befunde {sev}</div>
                              <div className="text-xs text-slate-500">{items.length} Einträge</div>
                            </div>
                            <span className="text-xs text-slate-500">Ein-/Ausklappen</span>
                          </summary>

                          <div className="px-5 pb-5 space-y-4 bg-slate-50/60">
                            {items.map((f, idx) => {
                              const t = translateFinding(f);
                              const steps = (f.fixSteps || []).slice(0, 3);
                              return (
                                <div key={`${f.ruleId}-${idx}`} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${severityBadge(f.severity)}`}>{f.severity}</span>
                                      <div className="font-extrabold text-slate-900">
                                        {(f.title || f.ruleId) ? (t.title || f.ruleId) : "Befund"}
                                      </div>
                                    </div>
                                    {f.ruleId && (
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{f.ruleId}</span>
                                    )}
                                  </div>

                                  {t.description && <p className="mt-2 text-sm text-slate-700 leading-relaxed">{t.description}</p>}

                                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                      <div className="text-[10px] font-bold text-slate-500 uppercase">URL</div>
                                      <div className="text-xs text-slate-700 break-words">{f.pageUrl || "—"}</div>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                      <div className="text-[10px] font-bold text-slate-500 uppercase">Zeitpunkt</div>
                                      <div className="text-xs text-slate-700 break-words">{f.capturedAt || "—"}</div>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                      <div className="text-[10px] font-bold text-slate-500 uppercase">Selektor</div>
                                      <div className="text-xs text-slate-700 break-words">{f.selector || "—"}</div>
                                    </div>
                                  </div>

                                  <div className="mt-4">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Evidence</div>
                                    <div className="space-y-3">
                                      {t.failureSummary && (
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                          <div className="text-[10px] font-bold text-slate-500 uppercase">Fehlerbeschreibung</div>
                                          <div className="text-xs text-slate-700 whitespace-pre-wrap">{t.failureSummary}</div>
                                        </div>
                                      )}
                                      {/* screenshot removed */}
                                      {f.snippet && (
                                        <pre className="text-xs bg-slate-900 text-slate-100 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap">{f.snippet}</pre>
                                      )}
                                      {!t.failureSummary && !f.snippet && (
                                        <div className="text-xs text-slate-500">Keine Belege verfügbar.</div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="mt-4">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Fix steps</div>
                                    {steps.length ? (
                                      <ol className="list-decimal pl-5 space-y-1 text-sm text-slate-700">
                                        {steps.map((s, i) => (
                                          <li key={i}>{s}</li>
                                        ))}
                                      </ol>
                                    ) : (
                                      <div className="text-sm text-slate-500">Keine konkreten Schritte verfügbar.</div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </details>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-10">
                {/* Kurzcheck-Summary + CTA */}
                {!!teaser && (
                  <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="text-center">
                      <h4 className="text-2xl font-black tracking-tight">
                        Dein Kurzcheck: <span className="text-blue-700">{teaser.totals.total}</span> Probleme gefunden
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
                      <div className="text-sm text-slate-700 mt-1">Hinweis: {teaser.sampleFinding.hint}</div>
                    </div>

                    {/* CTA */}
                    <div className="mt-6">
                      <div className="mb-3 text-center text-sm font-semibold text-slate-700">
                        Kleine Barrierefreiheits-Fehler reichen oft schon, um auffällig zu werden – holen Sie sich jetzt Klarheit.
                      </div>

                      <button
                        onClick={unlock}
                        disabled={busy}
                        className="w-full bg-red-600 text-white hover:bg-red-700 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 uppercase tracking-tight shadow-xl shadow-red-600/20 disabled:opacity-50"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3" />
                        </svg>
                        {record?.isPaid ? "PDF öffnen" : "Jetzt Report freischalten"}
                      </button>

                      {!record?.isPaid && (
                        <div className="mt-4 text-center text-xs text-slate-600">
                          Firmenrechnung möglich (Firmenname, Rechnungsadresse &amp; Steuer‑ID im Checkout).
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {tiers.map((t) => {
                        const isRec = t.id === recommendedTier;
                        const isSelected = tier === t.id;
                        const save = Math.max(0, t.compareAt - t.price);

                        return (
                          <button
                            key={t.id}
                            onClick={() => setTier(t.id)}
                            className={`text-left rounded-3xl border transition-all relative p-5 ${
                              isSelected
                                ? "bg-slate-900 border-slate-900 text-white shadow-xl"
                                : "bg-white border-slate-200 text-slate-900 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className={`text-lg font-black tracking-tight ${isSelected ? "text-white" : "text-slate-900"}`}>{t.label}</div>
                                <div className={`mt-1 text-xs font-bold uppercase tracking-wider ${isSelected ? "text-white/70" : "text-slate-500"}`}>{t.desc}</div>
                              </div>

                              {isRec && (
                                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black border ${isSelected ? "bg-white/10 border-white/20 text-white" : "bg-blue-50 border-blue-200 text-blue-700"}`}>
                                  Empfohlen
                                </span>
                              )}
                            </div>

                            <div className="mt-4 flex items-baseline gap-2">
                              <div className={`text-3xl font-black ${isSelected ? "text-white" : "text-slate-900"}`}>€{t.price}</div>
                              <div className={`text-sm font-bold line-through ${isSelected ? "text-white/50" : "text-slate-400"}`}>€{t.compareAt}</div>
                            </div>

                            <div className="mt-3 flex items-center justify-between gap-3">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black border ${isSelected ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-200" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
                                Februar‑Special · spare €{save}
                              </span>
                              <span className={`text-[11px] font-semibold ${isSelected ? "text-white/70" : "text-slate-500"}`}>Einmalig · kein Abo</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="max-w-2xl mx-auto rounded-3xl border border-slate-200 bg-white p-6">
                      <div className="text-center">
                        <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">Paket‑Empfehlung</div>
                        <div className="mt-1 text-sm font-semibold text-slate-700">
                          {typeof estimatedPages === "number" ? (
                            <>Geschätzte Seiten: <span className="font-black text-slate-900">~{estimatedPages}</span></>
                          ) : (
                            <>Wir schätzen den Umfang nach Scan‑Fortschritt.</>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="text-xs font-black text-slate-900">Mini</div>
                          <div className="mt-1 text-xs text-slate-600">Für eine schnelle Einschätzung.</div>
                          <div className="mt-3 text-[11px] font-semibold text-slate-600">Bis 5 Seiten</div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="text-xs font-black text-slate-900">Standard</div>
                          <div className="mt-1 text-xs text-slate-600">Wichtigste Seiten &amp; Flows.</div>
                          <div className="mt-3 text-[11px] font-semibold text-slate-600">Bis 15 Seiten</div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="text-xs font-black text-slate-900">Plus</div>
                          <div className="mt-1 text-xs text-slate-600">Repräsentativer Audit für größere Websites/Shops.</div>
                          <div className="mt-3 text-[11px] font-semibold text-slate-600">Bis 50 Seiten</div>
                        </div>
                      </div>

                      {typeof estimatedPages === "number" && estimatedPages > 50 && (
                        <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-[12px] text-amber-900">
                          <span className="font-black">Hinweis:</span> Es wurden mehr als 50 Seiten entdeckt.
                          Plus ist dann am sinnvollsten (repräsentativ). Für 100% Abdeckung bitte Scope/Unterseiten eingrenzen.
                        </div>
                      )}
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
  const { data: session } = useSession();
  const backHref = session?.user ? "/scans" : "/";
  const backLabel = session?.user ? "Zur Übersicht" : "Zur Startseite";

  return (
    <main className="min-h-screen bg-background text-foreground hero-gradient selection:bg-blue-500/30 pt-24 md:pt-32 pb-20 px-4 md:px-6">
      <nav className="fixed top-0 w-full z-50 border-b border-slate-200/60 glass">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <BrandMark />
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <AuthNav />

            {/* Mobile: icon only */}
            <Link
              href={backHref}
              aria-label={backLabel}
              className="inline-flex md:hidden items-center justify-center h-10 w-10 rounded-full border border-slate-200 bg-white/70 text-slate-700 hover:text-blue-700"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </Link>

            {/* Desktop */}
            <Link href={backHref} className="hidden md:flex text-sm font-medium text-slate-600 hover:text-blue-600 transition items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              {backLabel}
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
