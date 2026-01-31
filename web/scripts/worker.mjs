#!/usr/bin/env node
/* eslint-disable no-console */

import { chromium } from "playwright";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

function getConvex() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  if (!url) throw new Error("Missing NEXT_PUBLIC_CONVEX_URL (or CONVEX_URL)");
  return new ConvexHttpClient(url);
}

const DEFAULT_CTX = {
  bypassCSP: true,
  viewport: { width: 1280, height: 720 },
  locale: "de-DE",
  timezoneId: "Europe/Berlin",
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  extraHTTPHeaders: {
    "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
  },
};

function severityFromImpact(impact) {
  if (!impact) return "P2";
  if (impact === "critical" || impact === "serious") return "P0";
  if (impact === "moderate") return "P1";
  return "P2";
}

function deTitleForRule(ruleId) {
  switch (String(ruleId || "")) {
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

function deDescriptionForRule(ruleId) {
  switch (String(ruleId || "")) {
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

function deFailureSummary(s) {
  if (!s) return s;
  return String(s)
    .replace(/^Fix all of the following:/gm, "Beheben Sie Folgendes:")
    .replace(/^Fix any of the following:/gm, "Beheben Sie mindestens eines der folgenden Probleme:")
    .replace(/^Ensure /gm, "Stellen Sie sicher, dass ");
}

function fixStepsForRule(ruleId) {
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
        'Für informative Bilder sinnvolles alt="…" ergänzen.',
        'Dekorative Bilder: alt="" und role="presentation" (oder via CSS Background).',
        "Keine redundanten Texte (z.B. 'Bild von …').",
      ];
    case "landmark-one-main":
      return [
        'Genau ein <main> Landmark pro Seite (oder role="main").',
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

function normalizeUrl(u) {
  try {
    const url = new URL(u);
    // Drop hash
    url.hash = "";
    return url.toString();
  } catch {
    return u;
  }
}

async function discoverImportantUrls(page, startUrl, maxPages) {
  const base = new URL(startUrl);
  const origin = base.origin;

  const links = await page
    .evaluate(() =>
      Array.from(document.querySelectorAll('a[href]'))
        .map((a) => a.getAttribute('href'))
        .filter(Boolean)
    )
    .catch(() => []);

  const candidates = [];
  for (const href of links) {
    try {
      const u = new URL(href, startUrl);
      if (u.origin !== origin) continue;
      // avoid common junk
      if (u.pathname.match(/\.(pdf|jpg|jpeg|png|gif|webp|svg|zip)$/i)) continue;
      if (u.searchParams.toString().length > 120) continue;
      candidates.push(u.toString());
    } catch {
      // ignore
    }
  }

  const isLegal = (u) => /impressum|datenschutz|privacy|kontakt|contact|agb|terms/i.test(u);

  const dedup = new Set();
  const ordered = [];

  // Always include start
  dedup.add(normalizeUrl(startUrl));
  ordered.push(startUrl);

  // Legal pages first
  for (const u of candidates.filter(isLegal)) {
    const nu = normalizeUrl(u);
    if (dedup.has(nu)) continue;
    dedup.add(nu);
    ordered.push(u);
    if (ordered.length >= maxPages) return ordered;
  }

  // Then rest
  for (const u of candidates) {
    const nu = normalizeUrl(u);
    if (dedup.has(nu)) continue;
    dedup.add(nu);
    ordered.push(u);
    if (ordered.length >= maxPages) return ordered;
  }

  return ordered;
}

async function runAxeOnPage(page) {
  const axeSource = await readFile(path.join(process.cwd(), "node_modules/axe-core/axe.min.js"), "utf8");
  await page.addScriptTag({ content: axeSource });
  await page.waitForTimeout(50);

  const results = await page.evaluate(async () => {
    // axe is injected at runtime
    return await window.axe.run(document, { resultTypes: ["violations"] });
  });

  const raw = (results.violations || []).flatMap((v) => {
    const impact = v.impact ?? null;
    const severity = severityFromImpact(impact);
    const nodes = Array.isArray(v.nodes) ? v.nodes : [];
    const nodesLimited = nodes.slice(0, 5);
    return nodesLimited.map((node) => ({
      severity,
      impact,
      ruleId: v.id,
      title: deTitleForRule(v.id) || v.help,
      description: deDescriptionForRule(v.id) || v.description,
      helpUrl: v.helpUrl,
      tags: v.tags ?? [],
      selector: node?.target?.[0] ?? null,
      snippet: node?.html ?? null,
      failureSummary: deFailureSummary(node?.failureSummary ?? null),
      fixSteps: fixStepsForRule(String(v.id || "")),
    }));
  });

  const sortKey = (s) => (s === "P0" ? 0 : s === "P1" ? 1 : 2);

  // Keep deterministic order + cap
  const findings = raw
    .sort((a, b) => {
      const d = sortKey(a.severity) - sortKey(b.severity);
      if (d) return d;
      const r = String(a.ruleId || "").localeCompare(String(b.ruleId || ""));
      if (r) return r;
      return String(a.selector || "").localeCompare(String(b.selector || ""));
    })
    .slice(0, 120);

  return findings;
}

async function scanUrlWithFallbacks(context, url, perPageTimeoutMs) {
  const started = Date.now();
  const page = await context.newPage();

  // Resource blocking
  await page.route("**/*", (route) => {
    const type = route.request().resourceType();
    if (type === "image" || type === "media" || type === "font") return route.abort();
    return route.continue();
  });

  try {
    // FULL
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: perPageTimeoutMs });
    const findings = await runAxeOnPage(page);
    const ms = Date.now() - started;
    return { mode: "FULL", findings, ms };
  } catch (e) {
    // LIGHT: try again with stricter timeout and no extra work
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: Math.min(12_000, perPageTimeoutMs) });
      const findings = await runAxeOnPage(page);
      const ms = Date.now() - started;
      return { mode: "LIGHT", findings, ms };
    } catch {
      // STATIC: no browser render results (we still return a synthetic finding)
      const ms = Date.now() - started;
      return {
        mode: "STATIC",
        findings: [
          {
            severity: "P2",
            impact: null,
            ruleId: "render-failed",
            title: "Seite konnte nicht stabil gerendert werden (Fallback: Static)",
            description: "Die Seite wurde im Vollmodus nicht zuverlässig geladen (Timeout/Redirect/Consent). Die Ergebnisse sind ggf. unvollständig.",
            helpUrl: null,
            tags: [],
            selector: null,
            snippet: null,
            failureSummary: String(e?.message || e),
            fixSteps: ["Seite manuell prüfen (Consent/Redirects).", "Erneut scannen (ggf. nachts / ohne A/B Tests)."],
          },
        ],
        ms,
      };
    }
  } finally {
    await page.close().catch(() => {});
  }
}

async function processJob(convex, claim) {
  const { jobId, scanId, scan } = claim;

  const tier = scan.tier || "mini";
  const plan = scan.plan || {
    maxPages: tier === "plus" ? 50 : tier === "standard" ? 10 : 1,
    maxWallTimeMs: tier === "plus" ? 20 * 60_000 : tier === "standard" ? 7 * 60_000 : 2 * 60_000,
    maxPerPageTimeMs: 25_000,
  };

  console.log(`[worker] start scan ${String(scanId)} tier=${tier} maxPages=${plan.maxPages}`);

  await convex.mutation(api.scans.setStatus, { scanId, status: "RUNNING" });

  const browser = await chromium.launch();
  const context = await browser.newContext(DEFAULT_CTX);

  const runStart = Date.now();
  const allFindings = [];
  const pagesMeta = [];

  try {
    // Prime on start URL
    const primePage = await context.newPage();
    await primePage.goto(scan.url, { waitUntil: "domcontentloaded", timeout: plan.maxPerPageTimeMs }).catch(() => {});
    const urls = await discoverImportantUrls(primePage, scan.url, plan.maxPages);
    await primePage.close().catch(() => {});

    const pagesTotal = urls.length;
    await convex.mutation(api.scans.updateProgress, { scanId, pagesDone: 0, pagesTotal, pages: [] });

    for (let i = 0; i < urls.length; i++) {
      const wall = Date.now() - runStart;
      if (wall > plan.maxWallTimeMs) break;

      const u = urls[i];
      const res = await scanUrlWithFallbacks(context, u, plan.maxPerPageTimeMs);
      pagesMeta.push({ url: u, mode: res.mode, ms: res.ms });

      for (const f of res.findings) {
        if (allFindings.length >= 500) break;
        allFindings.push({ ...f, pageUrl: u, mode: res.mode });
      }

      await convex.mutation(api.scans.updateProgress, {
        scanId,
        pagesDone: i + 1,
        pagesTotal,
        pages: pagesMeta,
      });
    }

    const totals = {
      p0: allFindings.filter((f) => f.severity === "P0").length,
      p1: allFindings.filter((f) => f.severity === "P1").length,
      p2: allFindings.filter((f) => f.severity === "P2").length,
      total: allFindings.length,
    };

    const sample = allFindings[0] || {
      title: "Keine automatischen Issues gefunden",
      severity: "P2",
      hint: "Fix-Hinweis: Details im Vollreport",
    };

    // Store results directly on scan
    await convex.mutation(api.scans.setStatus, { scanId, status: "SUCCEEDED" });
    await convex.mutation(api.scans.updateProgress, {
      scanId,
      pagesDone: pagesMeta.length,
      pagesTotal: urls.length,
      pages: pagesMeta,
    });

    // Patch findings/totals/sampleFinding
    // (No dedicated mutation yet; keep it minimal by reusing create-like patch via setStatus? We'll patch via a dedicated mutation call.)
    await convex.mutation(api.scansWorker.storeResults, {
      scanId,
      totals,
      sampleFinding: {
        title: String(sample.title || ""),
        severity: sample.severity,
        hint: sample.helpUrl ? `Fix-Hinweis: ${sample.helpUrl}` : "Fix-Hinweis: Details im Vollreport",
      },
      findings: allFindings,
    });

    await convex.mutation(api.scanJobs.complete, { jobId });
    console.log(`[worker] done scan ${String(scanId)} findings=${totals.total}`);
  } catch (e) {
    console.error(`[worker] failed scan ${String(scanId)}:`, e);
    await convex.mutation(api.scanJobs.fail, { jobId, error: String(e?.message || e) });
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

async function main() {
  const convex = getConvex();

  const intervalMs = Number(process.env.WORKER_POLL_MS || 2500);

  console.log(`[worker] started. polling every ${intervalMs}ms`);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const claim = await convex.mutation(api.scanJobs.claimNext, { now: Date.now() });
      if (claim) {
        await processJob(convex, claim);
      } else {
        await new Promise((r) => setTimeout(r, intervalMs));
      }
    } catch (e) {
      console.error("[worker] loop error:", e);
      await new Promise((r) => setTimeout(r, Math.max(2000, intervalMs)));
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
