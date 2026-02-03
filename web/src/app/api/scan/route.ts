/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { chromium } from "playwright-core";
import chromiumLambda from "@sparticuz/chromium";
import { readFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

export const runtime = "nodejs";

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return null;
  return new ConvexHttpClient(url);
}

type Severity = "P0" | "P1" | "P2";

type RateKey = string;
const RATE_BUCKET: Map<RateKey, { resetAt: number; count: number }> =
  // eslint-disable-next-line no-var
  (globalThis as any).__als_rate_bucket || new Map();
// eslint-disable-next-line no-var
(globalThis as any).__als_rate_bucket = RATE_BUCKET;

type DedupeKey = string;
type DedupePayload = {
  jobId: string;
  scanId: string;
  scanToken: string;
  discoveredPages: number;
  recommendedTier: string;
};
const DEDUPE_BUCKET: Map<DedupeKey, { createdAt: number; promise: Promise<DedupePayload> }> =
  // eslint-disable-next-line no-var
  (globalThis as any).__als_scan_dedupe || new Map();
// eslint-disable-next-line no-var
(globalThis as any).__als_scan_dedupe = DEDUPE_BUCKET;
const DEDUPE_WINDOW_MS = 15_000;

function getClientIp(req: Request) {
  // Basic best-effort IP extraction (works behind common proxies).
  const fwd = req.headers.get("x-forwarded-for") || "";
  const first = fwd.split(",")[0]?.trim();
  return first || req.headers.get("x-real-ip") || "unknown";
}

function rateLimitOrNull(req: Request) {
  const ip = getClientIp(req);
  const now = Date.now();

  const windowMs = Number(process.env.SCAN_RATE_LIMIT_WINDOW_MS || 60_000);
  const max = Math.max(1, Number(process.env.SCAN_RATE_LIMIT_MAX || 10));

  const key = `scan:${ip}`;
  const cur = RATE_BUCKET.get(key);
  if (!cur || cur.resetAt <= now) {
    RATE_BUCKET.set(key, { resetAt: now + windowMs, count: 1 });
    return null;
  }
  if (cur.count >= max) {
    const retryAfterSec = Math.max(1, Math.ceil((cur.resetAt - now) / 1000));
    return { retryAfterSec, ip };
  }
  cur.count += 1;
  RATE_BUCKET.set(key, cur);
  return null;
}

function severityFromImpact(impact?: string | null): Severity {
  if (!impact) return "P2";
  if (impact === "critical" || impact === "serious") return "P0";
  if (impact === "moderate") return "P1";
  return "P2";
}

function deTitleForRule(ruleId: string): string | null {
  switch (ruleId) {
    case "link-name":
      return "Links müssen einen erkennbaren Text haben";
    case "color-contrast":
      return "Text/Elemente müssen ausreichenden Kontrast haben";
    case "image-alt":
      return "Bilder benötigen Alternativtexte";
    case "label":
    case "label-title-only":
      return "Formularfelder benötigen Labels";
    case "landmark-one-main":
      return "Dokument braucht genau einen Hauptbereich (main)";
    case "region":
      return "Inhalte sollen in Landmarken liegen";
    default:
      return null;
  }
}

function deDescriptionForRule(ruleId: string): string | null {
  switch (ruleId) {
    case "link-name":
      return "Links benötigen einen zugänglichen Namen (sichtbarer Text oder aria-label/aria-labelledby).";
    case "color-contrast":
      return "Der Kontrast zwischen Vordergrund und Hintergrund muss die WCAG-Mindestwerte erfüllen.";
    case "image-alt":
      return "Informative Bilder brauchen ein sinnvolles alt-Attribut; dekorative Bilder alt=\"\".";
    case "landmark-one-main":
      return "Es sollte genau ein <main>-Landmark pro Seite vorhanden sein.";
    case "region":
      return "Seiteninhalt sollte innerhalb von Landmarken (header/nav/main/footer/aside) liegen.";
    default:
      return null;
  }
}

function deFailureSummary(s?: string | null) {
  if (!s) return s;
  return String(s)
    .replace(/^Fix all of the following:/gm, "Beheben Sie Folgendes:")
    .replace(/^Fix any of the following:/gm, "Beheben Sie mindestens eines der folgenden Probleme:")
    .replace(/^Ensure /gm, "Stellen Sie sicher, dass ");
}

function fixStepsForRule(ruleId: string): string[] {
  // Short, implementation-first guidance. (No legal advice.)
  switch (ruleId) {
    case "color-contrast":
      return [
        "Text-/Icon-Kontrast messen (Normaltext ≥ 4.5:1, großer Text ≥ 3:1).",
        "Farben anpassen (Text dunkler/Background heller) oder Font-Weight/Size erhöhen.",
        "Re-test auf allen relevanten Zuständen (Hover/Disabled/Focus).",
      ];
    case "label":
    case "label-title-only":
      return [
        "Für jedes Input ein sichtbares <label> oder aria-label/aria-labelledby hinzufügen.",
        "Label eindeutig mit dem Feld verknüpfen (for/id oder aria-labelledby).",
        "Formular mit Tastatur + Screenreader kurz gegenprüfen.",
      ];
    case "image-alt":
      return [
        "Für informative Bilder sinnvolles alt=\"…\" ergänzen.",
        "Dekorative Bilder: alt=\"\" und role=\"presentation\" (oder via CSS Background).",
        "Keine redundanten Texte (z.B. 'Bild von …').",
      ];
    case "landmark-one-main":
      return [
        "Genau ein <main> Landmark pro Seite (oder role=\"main\").",
        "Layout prüfen: Header/Nav/Aside/Footer korrekt semantisch strukturieren.",
        "Re-test: Screenreader-Landmark-Navigation.",
      ];
    case "aria-required-attr":
    case "aria-valid-attr":
    case "aria-roles":
      return [
        "ARIA nur verwenden, wenn nötig; Rollen/Attribute müssen zur Rolle passen.",
        "Ungültige Attribute entfernen oder auf passende Rolle umstellen.",
        "Mit Browser DevTools + axe re-testen.",
      ];
    default:
      return [
        "Element anhand Selector/Snippet lokalisieren.",
        "Fix laut verlinkter Regelbeschreibung umsetzen.",
        "Re-test (automatisch + kurz manuell im Flow).",
      ];
  }
}

function newAccessToken() {
  return crypto.randomBytes(24).toString("hex");
}

async function runAxeScan(safeUrl: string) {
  let browser: any = null;
  let context: any = null;
  let page: any = null;

  try {
    const executablePath = await chromiumLambda.executablePath();
    browser = await chromium.launch({
      executablePath,
      args: chromiumLambda.args,
      headless: true,
    });
    context = await browser.newContext({ bypassCSP: true });
    page = await context.newPage();

    await page.goto(safeUrl, { waitUntil: "domcontentloaded", timeout: 45_000 });

    const axeSource = await readFile(path.join(process.cwd(), "node_modules/axe-core/axe.min.js"), "utf8");
    await page.addScriptTag({ content: axeSource });
    await page.waitForTimeout(50);

    const axeType = await page.evaluate(() => typeof (window as any).axe);
    if (axeType === "undefined") throw new Error("axe_injection_failed");

    const results = await page.evaluate(async () => {
      // @ts-expect-error - axe is injected at runtime
      return await window.axe.run(document, { resultTypes: ["violations"] });
    });

    const nowIso = new Date().toISOString();

    const raw = (results.violations || []).flatMap((v: any) => {
      const impact = v.impact ?? null;
      const severity = severityFromImpact(impact);
      const nodes = Array.isArray(v.nodes) ? v.nodes : [];
      const nodesLimited = nodes.slice(0, 5);
      return nodesLimited.map((node: any) => ({
        severity,
        impact,
        ruleId: v.id,
        title: deTitleForRule(String(v.id || "")) || v.help,
        description: deDescriptionForRule(String(v.id || "")) || v.description,
        helpUrl: v.helpUrl,
        tags: v.tags ?? [],
        selector: node?.target?.[0] ?? null,
        snippet: node?.html ?? null,
        failureSummary: deFailureSummary(node?.failureSummary ?? null),
        fixSteps: fixStepsForRule(String(v.id || "")),
        pageUrl: safeUrl,
        capturedAt: nowIso,
      }));
    });

    const sortKey = (s: Severity) => (s === "P0" ? 0 : s === "P1" ? 1 : 2);
    const findings = raw
      .sort((a: any, b: any) => {
        const d = sortKey(a.severity) - sortKey(b.severity);
        if (d) return d;
        const r = String(a.ruleId || "").localeCompare(String(b.ruleId || ""));
        if (r) return r;
        return String(a.selector || "").localeCompare(String(b.selector || ""));
      })
      .slice(0, 60);

    const totals = {
      p0: findings.filter((f: any) => f.severity === "P0").length,
      p1: findings.filter((f: any) => f.severity === "P1").length,
      p2: findings.filter((f: any) => f.severity === "P2").length,
      total: findings.length,
    };

    const sample = findings[0] ?? {
      severity: "P2" as const,
      title: "Keine automatischen Probleme gefunden",
      description: "",
      helpUrl: null,
      selector: null,
      snippet: null,
      fixSteps: [],
    };

    // Teaser-Hinweis: bewusst ohne englische Begriffe und ohne bloßen Deque-Link.
    // Ziel: in 1–2 Sätzen sagen, was zu tun ist.
    const steps = Array.isArray((sample as any).fixSteps) ? (sample as any).fixSteps.filter(Boolean) : [];
    const hint = steps.length
      ? `Behebung: ${steps.slice(0, 2).join(" ")}`
      : "Behebung: Details im Vollreport.";

    const sampleFinding = {
      title: sample.title,
      severity: sample.severity,
      hint,
    };

    return { totals, sampleFinding, findings };
  } finally {
    await page?.close?.().catch(() => {});
    await context?.close?.().catch(() => {});
    await browser?.close?.().catch(() => {});
  }
}

async function processQueueOnce(convex: ConvexHttpClient) {
  const claimed = await convex.mutation(api.scanJobs.claimNext, { now: Date.now() });
  if (!claimed) return { ran: false as const };

  const { jobId, scanId, scan } = claimed as any;
  const url = String(scan?.url || "");

  try {
    await convex.mutation(api.scans.setStatus, { scanId, status: "RUNNING" });
    const { totals, sampleFinding, findings } = await runAxeScan(url);
    await convex.mutation((api as any).scansWorker.storeResults, { scanId, totals, sampleFinding, findings });
    await convex.mutation(api.scans.setStatus, { scanId, status: "SUCCEEDED" });
    await convex.mutation(api.scanJobs.complete, { jobId });
    return { ran: true as const, ok: true as const, scanId };
  } catch (e: any) {
    const msg = String(e?.message || e);
    console.error("scan job failed", { jobId, scanId, msg });
    await convex.mutation(api.scans.setStatus, { scanId, status: "FAILED", error: msg });
    await convex.mutation(api.scanJobs.fail, { jobId, error: msg });
    return { ran: true as const, ok: false as const, scanId, error: msg };
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as { url?: string; authorizedToScan?: boolean };
  const safeUrl = String(body?.url || "").trim();
  const authorizedToScan = Boolean(body?.authorizedToScan);

  if (!authorizedToScan) {
    return NextResponse.json({ error: "authorization_required" }, { status: 400 });
  }
  if (!safeUrl.startsWith("http")) {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  const convex = getConvexClient();
  if (!convex) return NextResponse.json({ error: "convex_not_configured" }, { status: 500 });

  const ip = getClientIp(req);
  const dedupeKey = `scan:${ip}:${safeUrl}`;
  const now = Date.now();
  const existing = DEDUPE_BUCKET.get(dedupeKey);
  if (existing) {
    if (now - existing.createdAt <= DEDUPE_WINDOW_MS) {
      const payload = await existing.promise;
      return NextResponse.json({ ...payload, deduped: true });
    }
    DEDUPE_BUCKET.delete(dedupeKey);
  }

  const createPromise = (async () => {
    const limited = rateLimitOrNull(req);
    if (limited) {
      const err = new Error("rate_limited");
      (err as any).rateLimit = limited;
      throw err;
    }

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    // Keep a user row for reporting & future history.
    if (userId) {
      await convex
        .mutation((api as any).users.upsert, {
          userId,
          email: (session?.user as any)?.email ?? undefined,
          name: (session?.user as any)?.name ?? undefined,
          image: (session?.user as any)?.image ?? undefined,
        })
        .catch(() => {});
    }

    // Autoplan (discovery): estimate internal page count so the user doesn't need to know it.
    // This is intentionally lightweight (fetch + href parsing) to keep latency reasonable.
    async function discoverCount(startUrl: string, max = 60) {
      const start = new URL(startUrl);
      const origin = start.origin;

      // Two sets: one for URLs we've already fetched, and one for HTML pages we actually counted.
      const fetched = new Set<string>();
      const htmlPages = new Set<string>();
      const q: string[] = [start.toString()];
      let fetches = 0;

      const normalize = (u: URL) => {
        u.hash = "";
        u.search = "";

        // Treat /index.html and trailing slashes as the same page.
        u.pathname = u.pathname.replace(/\/index\.html?$/i, "/");
        if (u.pathname.length > 1 && u.pathname.endsWith("/")) u.pathname = u.pathname.slice(0, -1);

        return u.toString();
      };

      const isHtmlish = (u: URL) => {
        const p = u.pathname.toLowerCase();
        const badExt = [
          ".jpg",
          ".jpeg",
          ".png",
          ".webp",
          ".gif",
          ".svg",
          ".pdf",
          ".zip",
          ".mp4",
          ".mp3",
          ".webm",
          ".css",
          ".js",
          ".json",
          ".xml",
          ".txt",
          ".ico",
        ];
        if (badExt.some((ext) => p.endsWith(ext))) return false;

        // Avoid common CMS/API endpoints that are not "pages".
        const badPrefixes = ["/wp-json", "/wp-admin", "/wp-content", "/wp-includes", "/feed", "/sitemap", "/xmlrpc.php"];
        if (badPrefixes.some((pre) => p === pre || p.startsWith(`${pre}/`))) return false;

        return true;
      };

      while (q.length && htmlPages.size < max && fetches < max) {
        const cur = q.shift()!;
        const curUrl = new URL(cur);
        if (curUrl.origin !== origin) continue;
        if (!isHtmlish(curUrl)) continue;

        const curNorm = normalize(curUrl);
        if (fetched.has(curNorm)) continue;
        fetched.add(curNorm);

        try {
          const res = await fetch(curNorm, { headers: { accept: "text/html,application/xhtml+xml" } });
          fetches += 1;
          if (!res.ok) continue;

          const ct = String(res.headers.get("content-type") || "");
          if (!ct.includes("text/html")) continue;

          htmlPages.add(curNorm);

          const html = await res.text();
          const re = /href\s*=\s*["']([^"']+)["']/gi;
          let m: RegExpExecArray | null = null;
          while ((m = re.exec(html))) {
            const href = String(m[1] || "").trim();
            if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) continue;
            let u: URL;
            try {
              u = new URL(href, curNorm);
            } catch {
              continue;
            }
            if (u.origin !== origin) continue;
            if (!isHtmlish(u)) continue;

            const norm = normalize(u);
            if (!fetched.has(norm)) q.push(norm);
            if (htmlPages.size >= max) break;
          }
        } catch {
          // ignore
        }
      }

      return htmlPages.size || 1;
    }

    const discoveredPages = await discoverCount(safeUrl, 60).catch(() => 1);
    const recommendedTier =
      discoveredPages <= 5 ? "mini" : discoveredPages <= 15 ? "standard" : "plus";

    const accessToken = newAccessToken();
    const { scanId } = await convex.mutation(api.scans.createQueued, {
      url: safeUrl,
      accessToken,
      authorizedToScan,
      userId,
    });

    const { jobId } = await convex.mutation(api.scanJobs.enqueue, { scanId });

    // Best-effort: try to process immediately (or on subsequent status polls).
    // Best-effort: try to process immediately.
    // Use the shared worker logic so we stay consistent with /api/scan/worker.
    const { processQueueOnce: processQueueOnceShared } = await import("@/lib/scanQueueWorker");
    await processQueueOnceShared(convex).catch(() => {});

    return {
      jobId,
      scanId,
      scanToken: accessToken,
      discoveredPages,
      recommendedTier,
    };
  })();

  DEDUPE_BUCKET.set(dedupeKey, { createdAt: now, promise: createPromise });

  try {
    const payload = await createPromise;
    return NextResponse.json(payload);
  } catch (err: any) {
    DEDUPE_BUCKET.delete(dedupeKey);
    if (err?.rateLimit) {
      const limited = err.rateLimit as { retryAfterSec: number };
      return NextResponse.json(
        { error: "rate_limited", retryAfterSec: limited.retryAfterSec },
        { status: 429, headers: { "retry-after": String(limited.retryAfterSec) } }
      );
    }
    throw err;
  }

}
