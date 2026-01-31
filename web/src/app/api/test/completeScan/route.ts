/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

export const runtime = "nodejs";

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return null;
  return new ConvexHttpClient(url);
}

function fixtureFindings(kind: "A" | "B", url: string) {
  const nowIso = new Date().toISOString();
  if (kind === "B") {
    return [
      {
        severity: "P1",
        impact: "moderate",
        ruleId: "landmark-one-main",
        title: "Document should have one main landmark",
        description: "Ensure the document has a main landmark",
        helpUrl: "https://dequeuniversity.com/rules/axe/4.11/landmark-one-main?application=axeAPI",
        selector: "html",
        snippet: '<html lang="en">',
        failureSummary: "Fix all of the following:\n  Document does not have a main landmark",
        fixSteps: ["Add exactly one <main> landmark."],
        pageUrl: url,
        capturedAt: nowIso,
      },
      {
        severity: "P2",
        impact: null,
        ruleId: "color-contrast",
        title: "Elements must meet minimum color contrast ratio thresholds",
        description: "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds",
        helpUrl: "https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=axeAPI",
        selector: "button",
        snippet: "<button>Buy</button>",
        failureSummary: "Element has insufficient color contrast",
        fixSteps: ["Increase contrast."],
        pageUrl: url,
        capturedAt: nowIso,
      },
    ];
  }

  return [
    {
      severity: "P1",
      impact: "moderate",
      ruleId: "landmark-one-main",
      title: "Document should have one main landmark",
      description: "Ensure the document has a main landmark",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.11/landmark-one-main?application=axeAPI",
      selector: "html",
      snippet: '<html lang="en">',
      failureSummary: "Fix all of the following:\n  Document does not have a main landmark",
      fixSteps: ["Add exactly one <main> landmark."],
      pageUrl: url,
      capturedAt: nowIso,
    },
    {
      severity: "P1",
      impact: "moderate",
      ruleId: "region",
      title: "All page content should be contained by landmarks",
      description: "Ensure all page content is contained by landmarks",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.11/region?application=axeAPI",
      selector: "div",
      snippet: "<div>Example Domain</div>",
      failureSummary: "Some page content is not contained by landmarks",
      fixSteps: ["Wrap content in landmarks."],
      pageUrl: url,
      capturedAt: nowIso,
    },
  ];
}

export async function POST(req: Request) {
  if (!(process.env.PLAYWRIGHT_TEST === "1" && req.headers.get("x-test-bypass") === "1")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const convex = getConvexClient();
  if (!convex) return NextResponse.json({ error: "convex_not_configured" }, { status: 500 });

  const body = (await req.json()) as { scanId?: string; kind?: "A" | "B" };
  if (!body.scanId) return NextResponse.json({ error: "missing_scanId" }, { status: 400 });

  const scan = await convex.query(api.scans.get, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scanId: body.scanId as any,
  });
  if (!scan) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const findings = fixtureFindings(body.kind ?? "A", scan.url);
  const totals = {
    p0: findings.filter((f) => f.severity === "P0").length,
    p1: findings.filter((f) => f.severity === "P1").length,
    p2: findings.filter((f) => f.severity === "P2").length,
    total: findings.length,
  };

  await convex.mutation(api.scans.setStatus, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scanId: body.scanId as any,
    status: "SUCCEEDED",
  });

  const sample = findings[0];
  await convex.mutation(api.scansWorker.storeResults, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scanId: body.scanId as any,
    totals,
    sampleFinding: {
      title: String(sample.title || ""),
      severity: sample.severity as "P0" | "P1" | "P2",
      hint: sample.helpUrl ? `Fix-Hinweis: ${sample.helpUrl}` : "Fix-Hinweis: Details im Vollreport",
    },
    findings,
  });

  return NextResponse.json({ ok: true, totals });
}
