import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

export const runtime = "nodejs";

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return null;
  return new ConvexHttpClient(url);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const scanId = String(searchParams.get("scanId") || "").trim();
  if (!scanId) return NextResponse.json({ error: "missing_scanId" }, { status: 400 });

  const convex = getConvexClient();
  if (!convex) return NextResponse.json({ error: "convex_not_configured" }, { status: 500 });

  const scan = await convex.query(api.scans.get, {
    // Convex document IDs are strings at runtime.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scanId: scanId as any,
  });

  if (!scan) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const token = String(req.headers.get("x-scan-token") || searchParams.get("token") || "");

  // Gate full details: unpaid → only teaser fields.
  const base = {
    scanId,
    url: scan.url,
    status: scan.status,
    isPaid: scan.isPaid,
    tier: scan.tier ?? null,
    plan: scan.plan ?? null,
    progress: scan.progress ?? null,
    pages: scan.pages ?? null,
    totals: scan.totals ?? null,
    sampleFinding: scan.sampleFinding ?? null,
    error: scan.error ?? null,
    previousScanId: scan.previousScanId ? String(scan.previousScanId) : null,
    diffSummary: (scan as any).diffSummary ?? null,
  };

  if (!scan.isPaid) return NextResponse.json(base);

  // Paid scans require proof of possession (token) in MVP.
  const storedToken = (scan as any).accessToken ? String((scan as any).accessToken) : "";
  if (!token || token !== storedToken) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Pull findings from the reports table (preferred), fallback to scan.findings.
  const report = await convex
    .query((api as any).reports.getByScan, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      scanId: scanId as any,
    })
    .catch(() => null);

  const pdf = await convex
    .query((api as any).pdfs.getLatestByScan, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      scanId: scanId as any,
    })
    .catch(() => null);

  return NextResponse.json({
    ...base,
    findings: (report as any)?.findings ?? (scan as any).findings ?? [],
    pdfUrl: (pdf as any)?.url ?? null,
  });
}

