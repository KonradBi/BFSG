import { NextResponse } from "next/server";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

function severityFromImpact(impact?: string | null): "P0" | "P1" | "P2" {
  // Simple mapping for MVP
  if (!impact) return "P2";
  if (impact === "critical" || impact === "serious") return "P0";
  if (impact === "moderate") return "P1";
  return "P2";
}

export async function POST(req: Request) {
  const { url } = (await req.json()) as { url: string };
  const safeUrl = String(url || "").trim();
  if (!safeUrl.startsWith("http")) {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  // MVP: run scan synchronously; later move to worker/queue + DB persistence
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(safeUrl, { waitUntil: "domcontentloaded", timeout: 45000 });

    const results = await new AxeBuilder({ page }).analyze();

    const findings = results.violations.map((v) => {
      const firstNode = v.nodes?.[0];
      const impact = v.impact ?? null;
      const sev = severityFromImpact(impact);
      return {
        severity: sev,
        ruleId: v.id,
        title: v.help,
        description: v.description,
        helpUrl: v.helpUrl,
        selector: firstNode?.target?.[0] ?? null,
        snippet: firstNode?.html ?? null,
      };
    });

    const totals = {
      p0: findings.filter((f) => f.severity === "P0").length,
      p1: findings.filter((f) => f.severity === "P1").length,
      p2: findings.filter((f) => f.severity === "P2").length,
      total: findings.length,
    };

    const sample = findings[0] ?? {
      severity: "P2" as const,
      title: "Keine automatischen Issues gefunden",
      description: "",
      helpUrl: null,
      selector: null,
      snippet: null,
    };

    // Fake scanId for now (no DB yet wired in this route)
    const scanId = `scan_${Date.now()}`;

    return NextResponse.json({
      scanId,
      url: safeUrl,
      totals,
      sampleFinding: {
        title: sample.title,
        severity: sample.severity,
        hint: sample.helpUrl ? `Fix-Hinweis: ${sample.helpUrl}` : "Fix-Hinweis: Details im Vollreport",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: "scan_failed", details: String(e?.message || e) }, { status: 500 });
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}
