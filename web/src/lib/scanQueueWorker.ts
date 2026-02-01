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
    .replace(
      /^Fix any of the following:/gm,
      "Beheben Sie mindestens eines der folgenden Probleme:"
    )
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

export async function runAxeScan(safeUrl: string) {
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

    const axeSource = await readFile(
      path.join(process.cwd(), "node_modules/axe-core/axe.min.js"),
      "utf8"
    );
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
      // Hard cap returned findings so API response stays reasonable
      .slice(0, 120);

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
      hint: sample.helpUrl
        ? `Fix-Hinweis: ${sample.helpUrl}`
        : "Fix-Hinweis: Details im Vollreport",
    };

    return { totals, sampleFinding, findings };
  } finally {
    await page?.close?.().catch(() => {});
    await context?.close?.().catch(() => {});
    await browser?.close?.().catch(() => {});
  }
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

    const { totals, sampleFinding, findings } = await runAxeScan(url);

    await convex.mutation((api as any).scansWorker.storeResults, {
      scanId,
      totals,
      sampleFinding,
      findings,
    });

    await convex.mutation(api.scans.setStatus, { scanId, status: "SUCCEEDED" });
    await convex.mutation(api.scanJobs.complete, { jobId });

    return { ran: true as const, ok: true as const, scanId, jobId };
  } catch (e: any) {
    const msg = String(e?.message || e);
    console.error("scan job failed", { jobId, scanId, msg });

    // Keep error visible on scan.
    await convex.mutation(api.scans.setStatus, { scanId, status: "FAILED", error: msg });
    await convex.mutation(api.scanJobs.fail, { jobId, error: msg });

    return { ran: true as const, ok: false as const, scanId, jobId, error: msg };
  }
}
