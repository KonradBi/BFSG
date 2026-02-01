/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { chromium } from "playwright-core";
import chromiumLambda from "@sparticuz/chromium";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { api } from "../../../../../convex/_generated/api";

export const runtime = "nodejs";

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return null;
  return new ConvexHttpClient(url);
}

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
    .replace(/^Fix any of the following:/gm, "Beheben Sie mindestens eines der folgenden Probleme:")
    .replace(/^Ensure /gm, "Stellen Sie sicher, dass ");
}

function fixStepsForRule(ruleId: string): string[] {
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
    default:
      return [
        "Element anhand Selector/Snippet lokalisieren.",
        "Fix laut verlinkter Regelbeschreibung umsetzen.",
        "Re-test (automatisch + kurz manuell im Flow).",
      ];
  }
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

    const results = await page.evaluate(async () => {
      // @ts-expect-error - axe injected
      return await window.axe.run(document, { resultTypes: ["violations"] });
    });

    const nowIso = new Date().toISOString();

    const raw = (results.violations || []).flatMap((v: any) => {
      const impact = v.impact ?? null;
      const severity = severityFromImpact(impact);
      const nodes = Array.isArray(v.nodes) ? v.nodes : [];
      return nodes.slice(0, 5).map((node: any) => ({
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
        return String(a.ruleId || "").localeCompare(String(b.ruleId || ""));
      })
      .slice(0, 60);

    const totals = {
      p0: findings.filter((f: any) => f.severity === "P0").length,
      p1: findings.filter((f: any) => f.severity === "P1").length,
      p2: findings.filter((f: any) => f.severity === "P2").length,
      total: findings.length,
    };

    const first = findings[0];
    const sampleFinding = {
      title: first?.title ?? "Keine automatischen Issues gefunden",
      severity: first?.severity ?? ("P2" as const),
      hint: first?.helpUrl ? `Fix-Hinweis: ${first.helpUrl}` : "Fix-Hinweis: Details im Vollreport",
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
  if (!claimed) return;

  const { jobId, scanId, scan } = claimed as any;
  const url = String(scan?.url || "");

  try {
    await convex.mutation(api.scans.setStatus, { scanId, status: "RUNNING" });
    const { totals, sampleFinding, findings } = await runAxeScan(url);
    await convex.mutation((api as any).scansWorker.storeResults, { scanId, totals, sampleFinding, findings });
    await convex.mutation(api.scans.setStatus, { scanId, status: "SUCCEEDED" });
    await convex.mutation(api.scanJobs.complete, { jobId });
  } catch (e: any) {
    const msg = String(e?.message || e);
    await convex.mutation(api.scans.setStatus, { scanId, status: "FAILED", error: msg });
    await convex.mutation(api.scanJobs.fail, { jobId, error: msg });
  }
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const jobId = u.searchParams.get("jobId") || "";

  if (!jobId) return NextResponse.json({ error: "missing_jobId" }, { status: 400 });

  const convex = getConvexClient();
  if (!convex) return NextResponse.json({ error: "convex_not_configured" }, { status: 500 });

  // Each poll attempts to advance the queue.
  await processQueueOnce(convex).catch(() => {});

  const res = await convex.query((api as any).scanJobs.getStatus, { jobId });
  if (!res) return NextResponse.json({ error: "job_not_found" }, { status: 404 });

  const { job, scan } = res as any;

  if (job.status === "DONE" && scan) {
    return NextResponse.json({
      status: job.status,
      scanId: scan._id,
      url: scan.url,
      totals: scan.totals,
      sampleFinding: scan.sampleFinding,
      pdfUrl: `/api/report/pdf?scanId=${encodeURIComponent(String(scan._id))}&token=${encodeURIComponent(String(scan.accessToken || ""))}`,
    });
  }

  return NextResponse.json({ status: job.status, scanId: scan?._id, error: scan?.error });
}
