/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

type Severity = "P0" | "P1" | "P2";

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
  "landmark-one-main": {
    title: "Dokument braucht genau einen Hauptbereich (main)",
    description: "Es sollte genau ein <main>-Landmark pro Seite vorhanden sein.",
  },
  region: {
    title: "Inhalte sollen in Landmarken liegen",
    description: "Seiteninhalt sollte innerhalb von Landmarken (header/nav/main/footer/aside) liegen.",
  },
  "heading-order": {
    title: "Überschriften-Hierarchie sollte ohne Sprünge sein",
    description:
      "Überschriften (H1–H6) sollten die Seitenstruktur abbilden (z.B. H2 → H3 → H4). Sprünge (z.B. H2 → H4) sind meist kein Blocker, erschweren aber Screenreader-Navigation.",
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
  const ruleId = String((f as any).ruleId || "");
  const map = DE_RULE_TITLES[ruleId];
  return {
    title: map?.title ?? f.title,
    description: map?.description ?? f.description,
    failureSummary: translateFailureSummary(f.failureSummary),
    originalFailureSummary: f.failureSummary,
  };
}

type Finding = {
  severity: Severity;
  ruleId: string;
  title: string;
  description: string;
  helpUrl: string | null;
  selector: string | null;
  snippet: string | null;
  failureSummary: string | null;
  fixSteps: string[];
  screenshotDataUrl?: string | null;
  pageUrl?: string | null;
  capturedAt?: string | null;
};

function severityFromImpact(impact?: string | null): Severity {
  if (!impact) return "P2";
  if (impact === "critical" || impact === "serious") return "P0";
  if (impact === "moderate") return "P1";
  return "P2";
}

function fixStepsForRule(ruleId: string): string[] {
  switch (ruleId) {
    case "color-contrast":
      return [
        "Kontrast messen (Normaltext ≥ 4.5:1, großer Text ≥ 3:1).",
        "Farben/Weight/Size anpassen, Zustände (Hover/Focus/Disabled) prüfen.",
        "Re-test (automatisch + kurz manuell).",
      ];
    case "label":
    case "label-title-only":
      return [
        "Jedes Feld braucht einen Namen: <label> oder aria-label/aria-labelledby.",
        "Label eindeutig verknüpfen (for/id bzw. aria-labelledby).",
        "Manuell prüfen: Tastatur + Screenreader-Ansage.",
      ];
    case "image-alt":
      return [
        "Informative Bilder: sinnvolles alt ergänzen.",
        "Dekorative Bilder: alt=\"\" + role=\"presentation\" (oder CSS background).",
        "Keine redundanten Beschreibungen.",
      ];
    case "landmark-one-main":
      return [
        "Genau ein <main> pro Seite.",
        "Semantik prüfen: header/nav/aside/footer korrekt setzen.",
        "Re-test: Landmark-Navigation im Screenreader.",
      ];
    default:
      return [
        "Element über Selector/Snippet lokalisieren.",
        "Fix anhand der verlinkten Regelbeschreibung umsetzen.",
        "Re-test im relevanten Flow.",
      ];
  }
}

function escapeHtml(s: string) {
  // Avoid String.prototype.replaceAll edge-cases from non-string inputs.
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function reportHtml(params: {
  url: string;
  generatedAt: string;
  auditId: string;
  findingsHash: string;
  totals: { p0: number; p1: number; p2: number; total: number };
  pageShot?: string | null;
  findings: Finding[];
  brandLogoDataUrl?: string | null;
}) {
  const { url, generatedAt, auditId, findingsHash, totals, pageShot, findings, brandLogoDataUrl } = params;

  // Executive summary / quick recommendation
  const recos = [
    totals.p0
      ? `Sofortmaßnahmen: ${totals.p0} kritische Findings (P0) priorisieren und innerhalb von 24–72h beheben.`
      : "Keine P0-Findings gefunden (gut).",
    totals.p1 ? `Als nächstes: ${totals.p1} wichtige Findings (P1) in den Sprint aufnehmen.` : "Keine P1-Findings gefunden.",
    totals.total ? "Nach Fixes: Re-Scan durchführen und Änderungen verifizieren." : "",
  ].filter(Boolean);

  const by = {
    P0: findings.filter((f) => f.severity === "P0"),
    P1: findings.filter((f) => f.severity === "P1"),
    P2: findings.filter((f) => f.severity === "P2"),
  } as const;

  const section = (label: Severity, arr: Finding[]) => {
    if (!arr.length) return "";
    return `
      <div class="h2">${label} Befunde (${arr.length})</div>
      ${arr
        .map((f) => {
          const sevClass = f.severity.toLowerCase();
          const steps = (f.fixSteps || []).slice(0, 3);
          return `
            <section class="finding">
              <div class="finding__header">
                <div class="badge badge--${sevClass}">${f.severity}</div>
                <div class="finding__title">${escapeHtml(translateFinding(f).title)}</div>
              </div>

              <div class="finding__meta">
                <div><span class="label">Regel</span> <code>${escapeHtml(f.ruleId)}</code></div>
                ${f.pageUrl ? `<div><span class="label">URL</span> <span>${escapeHtml(f.pageUrl)}</span></div>` : ""}
                ${f.capturedAt ? `<div><span class="label">Zeit</span> <span>${escapeHtml(f.capturedAt)}</span></div>` : ""}
              </div>

              <div class="finding__desc">${escapeHtml(translateFinding(f).description)}</div>
              ${translateFinding(f).failureSummary ? `<div class="kv"><span class="label">Warum</span><span>${escapeHtml(translateFinding(f).failureSummary!)}</span></div>` : ""}
              ${translateFinding(f).originalFailureSummary && translateFinding(f).originalFailureSummary !== translateFinding(f).failureSummary ? `<div class="kv" style="font-size:10.5px;"><span class="label">Original (EN)</span><span>${escapeHtml(String(translateFinding(f).originalFailureSummary).slice(0, 900))}${String(translateFinding(f).originalFailureSummary).length > 900 ? "…" : ""}</span></div>` : ""}
              ${f.selector ? `<div class="kv"><span class="label">Selektor</span><code>${escapeHtml(f.selector)}</code></div>` : ""}

              ${steps.length ? `
                <div class="steps">
                  <div class="steps__title">Fix in 3 Schritten</div>
                  <ol>
                    ${steps.map((s) => `<li>${escapeHtml(s)}</li>`).join("\n")}
                  </ol>
                </div>
              ` : ""}

              ${f.screenshotDataUrl || f.snippet ? `
                <div class="evidence">
                  <div class="evidence__title">Beleg</div>
                  ${f.screenshotDataUrl ? `<div class="shot"><img alt="Element-Screenshot" src="${f.screenshotDataUrl}" /></div>` : ""}
                  ${f.snippet ? `<pre class="code"><code>${escapeHtml(f.snippet)}</code></pre>` : ""}
                </div>
              ` : ""}
            </section>
          `;
        })
        .join("\n")}
    `;
  };

  return `
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>BFSG-WebCheck – Audit Report</title>
  <style>
    :root {
      --text: #0f172a;
      --muted: #475569;
      --line: #e2e8f0;
      --bg: #ffffff;
      --bg2: #f8fafc;
      --p0: #b91c1c;
      --p1: #b45309;
      --p2: #1d4ed8;
    }

    * { box-sizing: border-box; }
    html, body { height: 100%; }
    body {
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
      color: var(--text);
      background: var(--bg);
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page { padding: 22px 26px; }

    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      border-bottom: 1px solid var(--line);
      padding-bottom: 10px;
      margin-bottom: 12px;
    }

    .brand { display:flex; align-items:flex-start; gap:18px; }
    .brand img { width: 128px; height: 128px; object-fit: contain; display:block; }
    .brand h1 { font-size: 24px; }

    h1 { font-size: 20px; margin: 0; letter-spacing: -0.02em; }

    .sub {
      margin-top: 6px;
      color: var(--muted);
      font-size: 12px;
      line-height: 1.35;
      word-break: break-word;
    }

    .meta {
      text-align: right;
      color: var(--muted);
      font-size: 12px;
      line-height: 1.35;
      white-space: nowrap;
    }

    .card {
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 14px;
      background: var(--bg2);
    }

    .kpis {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-top: 10px;
    }

    .kpi {
      border: 1px solid var(--line);
      background: #fff;
      border-radius: 12px;
      padding: 10px 12px;
    }

    .kpi .label { color: var(--muted); font-size: 11px; }
    .kpi .val { font-size: 18px; font-weight: 700; margin-top: 6px; }

    .h2 { font-size: 14px; font-weight: 800; margin: 14px 0 8px; }

    .finding {
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 12px 14px;
      margin-bottom: 10px;
      break-inside: avoid;
      page-break-inside: avoid;
      background: #fff;
    }

    .finding__header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
    .finding__title { font-weight: 800; font-size: 13px; line-height: 1.25; }

    .badge {
      font-size: 11px;
      font-weight: 900;
      padding: 4px 8px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: var(--bg2);
      min-width: 34px;
      text-align: center;
    }
    .badge--p0 { color: #fff; background: var(--p0); border-color: var(--p0); }
    .badge--p1 { color: #fff; background: var(--p1); border-color: var(--p1); }
    .badge--p2 { color: #fff; background: var(--p2); border-color: var(--p2); }

    .finding__meta {
      display: grid;
      grid-template-columns: 1fr;
      gap: 6px;
      color: var(--muted);
      font-size: 12px;
      margin-bottom: 8px;
    }

    .finding__desc { font-size: 12px; line-height: 1.45; margin-bottom: 8px; }

    .kv { font-size: 12px; color: var(--muted); margin-bottom: 8px; }
    .kv .label { display: inline-block; min-width: 90px; font-weight: 700; }

    .steps {
      border: 1px dashed var(--line);
      border-radius: 12px;
      padding: 10px 12px;
      margin: 10px 0;
      background: #fcfdff;
    }
    .steps__title { font-size: 12px; font-weight: 800; margin-bottom: 6px; }
    .steps ol { margin: 0; padding-left: 18px; color: var(--text); font-size: 12px; line-height: 1.45; }

    code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }

    .code {
      background: #0b1220;
      color: #e2e8f0;
      border-radius: 12px;
      padding: 10px 12px;
      overflow: hidden;
      margin: 0;
      font-size: 11px;
      line-height: 1.35;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .shot { margin: 8px 0; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
    .shot img { width: 100%; display: block; }

    .evidence {
      margin-top: 10px;
      border-top: 1px solid var(--line);
      padding-top: 8px;
    }
    .evidence__title { font-size: 12px; font-weight: 800; margin-bottom: 6px; color: var(--text); }

    a { color: #0b5bd3; text-decoration: none; word-break: break-word; }
    a:hover { text-decoration: underline; }

    .footerNote { margin-top: 12px; color: var(--muted); font-size: 10.5px; line-height: 1.35; }

    @media print { .page { padding: 0; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="topbar">
      <div>
        <div class="brand">
          ${brandLogoDataUrl ? `<img alt="BFSG WebCheck" src="${brandLogoDataUrl}" />` : ""}
          <div>
            <h1 style="margin:0">BFSG-WebCheck – Barrierefreiheits-Audit</h1>
            <div class="sub">
              Website: <b>${escapeHtml(url)}</b><br />
              Hinweis: Technischer Report (WCAG/EN 301 549/BITV) – <b>keine Rechtsberatung</b> und <b>keine Garantie auf BFSG-/WCAG-Konformität</b>.
            </div>
          </div>
        </div>
      </div>
      <div class="meta">
        Generiert: ${escapeHtml(generatedAt)}<br />
        Audit-ID: ${escapeHtml(auditId)}<br />
        Ergebnis-Hash: ${escapeHtml(findingsHash)}<br />
        Version: MVP
      </div>
    </div>

    <div class="card">
      <div class="h2">Kurzfazit (Executive Summary)</div>
      <div class="sub" style="margin-bottom:10px">
        Kurzfazit für Entscheider:innen – technische Prüfung nach WCAG/EN 301 549/BITV (keine Rechtsberatung).
      </div>

      <div class="kpis">
        <div class="kpi"><div class="label">P0 (kritisch)</div><div class="val">${totals.p0}</div></div>
        <div class="kpi"><div class="label">P1 (hoch)</div><div class="val">${totals.p1}</div></div>
        <div class="kpi"><div class="label">P2 (mittel)</div><div class="val">${totals.p2}</div></div>
        <div class="kpi"><div class="label">Gesamt</div><div class="val">${totals.total}</div></div>
      </div>

      <div class="footerNote" style="margin-top:10px">
        <b>Bedeutung der Prioritäten:</b>
        P0 = hohes Risiko / blockiert Nutzung (sofort fixen),
        P1 = relevante Barriere (zeitnah fixen),
        P2 = Verbesserung/Best Practice (einplanen).
      </div>

      <div class="steps" style="margin-top:12px">
        <div class="steps__title">Empfohlene nächsten Schritte</div>
        <ol>
          ${recos.map((r) => `<li>${escapeHtml(r)}</li>`).join("\n")}
        </ol>
      </div>

      ${pageShot ? `<div class="shot" style="margin-top:12px"><img alt="Seitenvorschau" src="${pageShot}" /></div>` : ""}

      <div class="footerNote">
        <b>Wichtig:</b> Automatisierte Checks finden nicht alles. Für BFSG-relevante Journeys empfehlen wir zusätzlich manuelle Prüfungen (Tastatur, Screenreader, Form-Flows).
      </div>
    </div>

    ${section("P0", by.P0)}
    ${section("P1", by.P1)}
    ${section("P2", by.P2)}

    <div class="footerNote" style="margin-top:16px; border-top:1px solid var(--line); padding-top:10px;">
      Tipp: Nutze diesen Report als Grundlage für Tickets. Priorisiere zuerst P0, dann P1. Re-test nach Fix.
    </div>
  </div>
</body>
</html>
`;
}

async function waitForDomStable(page: any, quietMs = 600, timeoutMs = 8000) {
  await page
    .evaluate(
      ({ quietMs, timeoutMs }: { quietMs: number; timeoutMs: number }) =>
        new Promise<void>((resolve) => {
          let done = false;
          let last = Date.now();

          const finish = () => {
            if (done) return;
            done = true;
            try {
              obs.disconnect();
            } catch {}
            resolve();
          };

          const tick = () => {
            if (done) return;
            const now = Date.now();
            if (now - last >= quietMs) return finish();
            if (now - start >= timeoutMs) return finish();
            setTimeout(tick, 50);
          };

          const start = Date.now();
          const obs = new MutationObserver(() => {
            last = Date.now();
          });
          obs.observe(document.documentElement, {
            subtree: true,
            childList: true,
            attributes: true,
            characterData: true,
          });

          setTimeout(tick, 50);
        }),
      { quietMs, timeoutMs }
    )
    .catch(() => {});
}

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return null;
  return new ConvexHttpClient(url);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // IMPORTANT: PDF is generated ONLY from stored findings (no live re-scan).
  const scanId = String(searchParams.get("scanId") || "").trim();
  const token = String(searchParams.get("token") || req.headers.get("x-scan-token") || "").trim();
  if (!scanId) return NextResponse.json({ error: "missing_scanId" }, { status: 400 });
  if (!token) return NextResponse.json({ error: "missing_token" }, { status: 401 });

  const convex = getConvexClient();
  if (!convex) return NextResponse.json({ error: "convex_not_configured" }, { status: 500 });

  const scan = await convex.query(api.scans.get, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scanId: scanId as any,
  });

  if (!scan) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!scan.isPaid) return NextResponse.json({ error: "not_paid" }, { status: 402 });
  if (scan.accessToken !== token) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const url = scan.url;
  const findings = Array.isArray(scan.findings) ? (scan.findings as Finding[]) : [];
  const totals =
    scan.totals ??
    ({
      p0: findings.filter((f) => f.severity === "P0").length,
      p1: findings.filter((f) => f.severity === "P1").length,
      p2: findings.filter((f) => f.severity === "P2").length,
      total: findings.length,
    } as const);

  const auditId = crypto.createHash("sha256").update(`${scanId}|${url}|${scan.updatedAt}`).digest("hex").slice(0, 12);
  const findingsHash = crypto
    .createHash("sha256")
    .update(
      JSON.stringify(
        findings.map((f) => ({
          severity: f.severity,
          ruleId: f.ruleId,
          selector: f.selector,
          failureSummary: f.failureSummary,
        }))
      )
    )
    .digest("hex")
    .slice(0, 16);

  let brandLogoDataUrl: string | null = null;
  try {
    const abs = path.join(process.cwd(), "public", "brand", "logo.png");
    const buf = await readFile(abs);
    // The file extension is .png but it's a JPEG in practice. Use image/jpeg.
    brandLogoDataUrl = `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch {
    brandLogoDataUrl = null;
  }

  const html = reportHtml({
    url,
    generatedAt: new Date().toISOString(),
    auditId,
    findingsHash,
    totals,
    findings,
    pageShot: null,
    brandLogoDataUrl,
  });

  // Render PDF from HTML
  // (no navigation, no external fetches needed)
  const browser = await (await import("playwright")).chromium.launch();
  const context = await browser.newContext({
    bypassCSP: true,
    viewport: { width: 1280, height: 720 },
    locale: "de-DE",
    timezoneId: "Europe/Berlin",
  });
  const pdfPage = await context.newPage();

  try {
    await pdfPage.setContent(html, { waitUntil: "domcontentloaded" });

    const pdf = await pdfPage.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "18mm", right: "14mm", bottom: "18mm", left: "14mm" },
      displayHeaderFooter: true,
      // Keep header empty (clean look). Branding is handled inside the PDF body.
      headerTemplate: `<div></div>`,
      footerTemplate: `<div style="font-size:9px;width:100%;padding:0 14mm;color:#64748b;display:flex;justify-content:space-between;">
          <span>${escapeHtml(url)}</span>
          <span><span class=\"pageNumber\"></span>/<span class=\"totalPages\"></span></span>
        </div>`,
    });

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `inline; filename="als-audit.pdf"`,
        "cache-control": "no-store",
        "x-audit-id": auditId,
        "x-audit-p0": String(totals.p0),
        "x-audit-p1": String(totals.p1),
        "x-audit-p2": String(totals.p2),
        "x-audit-total": String(totals.total),
        "x-findings-hash": findingsHash,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: "pdf_failed", details: String(e?.message || e) }, { status: 500 });
  } finally {
    await pdfPage.close().catch(() => {});
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}
