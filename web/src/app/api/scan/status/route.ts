/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { processQueueOnce as processQueueOnceShared } from "@/lib/scanQueueWorker";

export const runtime = "nodejs";

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return null;
  return new ConvexHttpClient(url);
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const jobId = u.searchParams.get("jobId") || "";

  if (!jobId) return NextResponse.json({ error: "missing_jobId" }, { status: 400 });

  const convex = getConvexClient();
  if (!convex) return NextResponse.json({ error: "convex_not_configured" }, { status: 500 });

  // Best-effort: try to advance queue so user sees progress even without cron.
  await processQueueOnceShared(convex).catch(() => {});

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
      progress: scan.progress ?? null,
      pages: scan.pages ?? null,
      pdfUrl: `/api/report/pdf?scanId=${encodeURIComponent(String(scan._id))}&token=${encodeURIComponent(String(scan.accessToken || ""))}`,
    });
  }

  return NextResponse.json({
    status: job.status,
    scanId: scan?._id,
    scanStatus: scan?.status,
    progress: scan?.progress ?? null,
    pages: scan?.pages ?? null,
    error: scan?.error,
  });
}
