/* eslint-disable @typescript-eslint/no-explicit-any */

import { chromium } from "playwright-core";
import chromiumLambda from "@sparticuz/chromium";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

// Shared scan runner + single-job queue worker.
//
// Why this exists:
// - /api/scan enqueues jobs and may try to run them best-effort.
// - Production needs a deterministic driver (Vercel Cron) to claim + process jobs.
// - Both routes should share the same scanning logic.

type Severity = "P0" | "P1" | "P2";

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
    case "render-failed":
      return "Seite konnte nicht stabil geladen werden";
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
    case "render-failed":
      return "Beim Laden/Rendern der Seite ist ein Fehler aufgetreten (Timeout, Navigation, Script).";
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
    default:
      return [
        "Element anhand Selector/Snippet lokalisieren.",
        "Fix laut verlinkter Regelbeschreibung umsetzen.",
        "Re-test (automatisch + kurz manuell im Flow).",
      ];
  }
}

function isProbablyHtmlUrl(u: URL) {
  const p = u.pathname.toLowerCase();
  // Skip common non-HTML assets
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
  ];
  return !badExt.some((ext) => p.endsWith(ext));
}

function normalizeDiscoveredUrl(u: URL) {
  // Remove hash + query to avoid duplicates from tracking params.
  u.hash = "";
  u.search = "";
  return u.toString();
}

async function fetchHtml(url: string, timeoutMs = 10_000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { accept: "text/html,application/xhtml+xml" },
    });
    const ct = res.headers.get("content-type") || "";
    if (!res.ok) return null;
    if (!ct.includes("text/html") && !ct.includes("application/xhtml") && !ct.includes("charset")) {
      // Best-effort: if content-type is missing or weird, still try.
      // But skip obvious binary.
    }
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function extractLinks(html: string): string[] {
  const out: string[] = [];
  const re = /href\s*=\s*["']([^"']+)["']/gi;
  let m: RegExpExecArray | null = null;
  while ((m = re.exec(html))) {
    const href = String(m[1] || "").trim();
    if (!href) continue;
    out.push(href);
  }
  return out;
}

async function discoverInternalPages(startUrl: string, maxPages: number) {
  const start = new URL(startUrl);
  const origin = start.origin;

  const seen = new Set<string>();
  const queue: Array<{ url: string; depth: number }> = [{ url: start.toString(), depth: 0 }];

  const MAX_DEPTH = 3;
  const MAX_FETCHES = Math.max(5, Math.min(60, maxPages * 2));
  let fetches = 0;

  while (queue.length && seen.size < maxPages && fetches < MAX_FETCHES) {
    const cur = queue.shift()!;
    const curUrl = cur.url;

    if (seen.has(curUrl)) continue;
    seen.add(curUrl);

    if (cur.depth >= MAX_DEPTH) continue;

    const html = await fetchHtml(curUrl);
    fetches += 1;
    if (!html) continue;

    const links = extractLinks(html);
    for (const href of links) {
      if (seen.size >= maxPages) break;
      if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) continue;

      let u: URL;
      try {
        u = new URL(href, curUrl);
      } catch {
        continue;
      }

      if (u.origin !== origin) continue;
      if (!isProbablyHtmlUrl(u)) continue;

      const normalized = normalizeDiscoveredUrl(u);
      // Skip obvious admin / checkout paths
      const p = new URL(normalized).pathname.toLowerCase();
      if (
        p.startsWith("/wp-admin") ||
        p.startsWith("/wp-login") ||
        p.startsWith("/cart") ||
        p.startsWith("/checkout") ||
        p.startsWith("/account")
      ) {
        continue;
      }

      if (!seen.has(normalized)) {
        queue.push({ url: normalized, depth: cur.depth + 1 });
      }
    }
  }

  // Preserve a stable order: start first, then others as discovered.
  return Array.from(seen);
}

function capString(s: unknown, max = 800) {
  const str = String(s ?? "");
  if (str.length <= max) return str;
  return str.slice(0, max) + "…";
}

function sanitizeFinding(f: any) {
  const out: any = { ...f };
  if (out.snippet) out.snippet = capString(out.snippet, 1200);
  if (out.failureSummary) out.failureSummary = capString(out.failureSummary, 800);
  if (out.title) out.title = capString(out.title, 180);
  if (out.description) out.description = capString(out.description, 600);
  if (Array.isArray(out.fixSteps)) out.fixSteps = out.fixSteps.slice(0, 5).map((s: any) => capString(s, 220));
  return out;
}

async function runAxeScanMulti(urls: string[], opts: { maxPerPageTimeMs: number; maxWallTimeMs: number }) {
  const startedAt = Date.now();

  let browser: any = null;
  let context: any = null;
  let page: any = null;

  const allFindings: any[] = [];

  // Capture at most N element screenshots (keeps PDF size + compute cost bounded).
  let screenshotsLeft = 10;

  async function captureElementScreenshotDataUrl(selector: string | null | undefined): Promise<string | null> {
    if (!page) return null;
    if (!selector) return null;

    try {
      const loc = page.locator(selector).first();
      await loc.waitFor({ state: "attached", timeout: 1200 }).catch(() => {});

      const box = await loc.boundingBox();
      if (!box) return null;

      // Scroll element into view (best effort)
      await page.evaluate(
        ({ y }: { y: number }) => {
          window.scrollTo({ top: Math.max(0, y - 120), left: 0, behavior: "instant" as any });
        },
        { y: box.y }
      );
      await page.waitForTimeout(50);

      const clip = {
        x: Math.max(0, box.x - 8),
        y: Math.max(0, box.y - 8),
        width: Math.min(900, box.width + 16),
        height: Math.min(520, box.height + 16),
      };

      const buf: Buffer = await page.screenshot({ type: "jpeg", quality: 60, clip });
      return `data:image/jpeg;base64,${buf.toString("base64")}`;
    } catch {
      return null;
    }
  }

  const executablePath = await chromiumLambda.executablePath();
  const axeSource = await readFile(path.join(process.cwd(), "node_modules/axe-core/axe.min.js"), "utf8");

  try {
    browser = await chromium.launch({ executablePath, args: chromiumLambda.args, headless: true });
    context = await browser.newContext({ bypassCSP: true });
    page = await context.newPage();

    for (const u of urls) {
      const now = Date.now();
      if (now - startedAt > opts.maxWallTimeMs) break;

      const pageStart = Date.now();
      try {
        await page.goto(u, { waitUntil: "domcontentloaded", timeout: Math.min(45_000, opts.maxPerPageTimeMs) });

        // Inject axe after navigation
        await page.addScriptTag({ content: axeSource });
        await page.waitForTimeout(40);

        const axeType = await page.evaluate(() => typeof (window as any).axe);
        if (axeType === "undefined") throw new Error("axe_injection_failed");

        const results = await page.evaluate(async () => {
          // @ts-expect-error injected
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
            pageUrl: u,
            capturedAt: nowIso,
          }));
        });

        // Attach up to 10 screenshots for the most important findings (P0/P1).
        for (const f of raw) {
          if (screenshotsLeft > 0 && (f.severity === "P0" || f.severity === "P1") && f.selector) {
            const shot = await captureElementScreenshotDataUrl(f.selector);
            if (shot) {
              f.screenshotDataUrl = shot;
              screenshotsLeft -= 1;
            }
          }
          allFindings.push(f);
          if (screenshotsLeft <= 0 && allFindings.length > 40) {
            // nothing special; keep scanning, but stop attempting screenshots
          }
        }
      } catch (e: any) {
        const nowIso = new Date().toISOString();
        allFindings.push({
          severity: "P0",
          impact: "critical",
          ruleId: "render-failed",
          title: deTitleForRule("render-failed"),
          description: deDescriptionForRule("render-failed"),
          helpUrl: null,
          tags: [],
          selector: null,
          snippet: null,
          failureSummary: `Fehler beim Scannen: ${String(e?.message || e).slice(0, 300)}`,
          fixSteps: ["Seite manuell öffnen und auf Redirects/Fehler prüfen.", "Scan erneut starten.", "Wenn es ein Login/Paywall ist: URL anpassen."],
          pageUrl: u,
          capturedAt: nowIso,
        });
      } finally {
        const elapsed = Date.now() - pageStart;
        if (elapsed < 80) await page.waitForTimeout(80 - elapsed);
      }
    }

    const sortKey = (s: Severity) => (s === "P0" ? 0 : s === "P1" ? 1 : 2);
    const findings = allFindings
      .map(sanitizeFinding)
      .sort((a: any, b: any) => {
        const d = sortKey(a.severity) - sortKey(b.severity);
        if (d) return d;
        const r = String(a.ruleId || "").localeCompare(String(b.ruleId || ""));
        if (r) return r;
        return String(a.selector || "").localeCompare(String(b.selector || ""));
      })
      .slice(0, 600);

    const totals = {
      p0: findings.filter((f: any) => f.severity === "P0").length,
      p1: findings.filter((f: any) => f.severity === "P1").length,
      p2: findings.filter((f: any) => f.severity === "P2").length,
      total: findings.length,
    };

    const sample = findings[0] || {
      title: "Keine automatischen Probleme gefunden",
      severity: "P2" as Severity,
      helpUrl: null,
    };

    const sampleFinding = {
      title: sample.title,
      severity: sample.severity,
      hint: sample.helpUrl ? `Fix-Hinweis: ${sample.helpUrl}` : "Fix-Hinweis: Details im Vollreport",
    };

    return { totals, sampleFinding, findings };
  } finally {
    await page?.close?.().catch(() => {});
    await context?.close?.().catch(() => {});
    await browser?.close?.().catch(() => {});
  }
}

export async function runAxeScan(safeUrl: string) {
  // Backwards-compatible single-page scan.
  return runAxeScanMulti([safeUrl], { maxPerPageTimeMs: 25_000, maxWallTimeMs: 2 * 60_000 });
}

/**
 * Claims and processes at most one queued scan job.
 *
 * Returns { ran: false } when there was no job to claim.
 */
export async function processQueueOnce(convex: ConvexHttpClient) {
  const claimed = await convex.mutation(api.scanJobs.claimNext, { now: Date.now() });
  if (!claimed) return { ran: false as const };

  const { jobId, scanId, scan } = claimed as any;
  const url = String(scan?.url || "");

  try {
    await convex.mutation(api.scans.setStatus, { scanId, status: "RUNNING" });

    const plan = (scan as any)?.plan ?? { maxPages: 1, maxWallTimeMs: 2 * 60_000, maxPerPageTimeMs: 25_000 };
    const maxPages = Math.max(1, Math.min(50, Number(plan.maxPages || 1)));

    // Discover pages (internal crawl) up to maxPages.
    const discovered = await discoverInternalPages(url, maxPages);

    // Update progress totals and show something in UI immediately.
    await convex.mutation(api.scans.updateProgress, {
      scanId,
      pagesDone: 0,
      pagesTotal: discovered.length,
      pages: [],
    });

    const startedAt = Date.now();
    const urlsToScan: string[] = [];
    for (const u of discovered) {
      if (urlsToScan.length >= maxPages) break;
      if (Date.now() - startedAt > Number(plan.maxWallTimeMs || 0)) break;
      urlsToScan.push(u);
    }

    const { totals, sampleFinding, findings } = await runAxeScanMulti(urlsToScan, {
      maxPerPageTimeMs: Number(plan.maxPerPageTimeMs || 25_000),
      maxWallTimeMs: Number(plan.maxWallTimeMs || 5 * 60_000),
    });

    // Update progress to "done".
    await convex.mutation(api.scans.updateProgress, {
      scanId,
      pagesDone: urlsToScan.length,
      pagesTotal: urlsToScan.length,
      pages: urlsToScan.map((u) => ({ url: u, mode: "FULL" as const, ms: 0 })),
    });

    await convex.mutation((api as any).scansWorker.storeResults, { scanId, totals, sampleFinding, findings });

    await convex.mutation(api.scans.setStatus, { scanId, status: "SUCCEEDED" });
    await convex.mutation(api.scanJobs.complete, { jobId });

    return { ran: true as const, ok: true as const, scanId, jobId };
  } catch (e: any) {
    const msg = String(e?.message || e);
    console.error("scan job failed", { jobId, scanId, msg });

    await convex.mutation(api.scans.setStatus, { scanId, status: "FAILED", error: msg });
    await convex.mutation(api.scanJobs.fail, { jobId, error: msg });

    return { ran: true as const, ok: false as const, scanId, jobId, error: msg };
  }
}
