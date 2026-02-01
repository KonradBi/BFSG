import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { processQueueOnce } from "@/lib/scanQueueWorker";

export const runtime = "nodejs";

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return null;
  return new ConvexHttpClient(url);
}

function isAuthorized(req: Request) {
  const expected = process.env.WORKER_SECRET;
  // If a secret is configured, require it.
  if (expected) {
    const got = req.headers.get("x-worker-secret");
    return Boolean(got && got === expected);
  }

  // Fallback: allow Vercel Cron requests if no secret is configured.
  // Note: this header can be spoofed; set WORKER_SECRET for real protection.
  return req.headers.get("x-vercel-cron") === "1";
}

function acquireLockOrNull() {
  const key = "__bfsg_scan_worker_lock";
  const now = Date.now();
  const ttlMs = 55_000; // keep under 1 minute cron cadence

  const cur = (globalThis as any)[key] as { until: number } | undefined;
  if (cur && cur.until > now) return null;

  (globalThis as any)[key] = { until: now + ttlMs };
  return { release: () => ((globalThis as any)[key] = { until: 0 }) };
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const lock = acquireLockOrNull();
  if (!lock) {
    return NextResponse.json({ ok: true, skipped: "locked" }, { status: 429 });
  }

  try {
    const convex = getConvexClient();
    if (!convex) return NextResponse.json({ error: "convex_not_configured" }, { status: 500 });

    const result = await processQueueOnce(convex);
    if (!result.ran) {
      // No job available
      return new NextResponse(null, { status: 204 });
    }

    if ((result as any).ok) {
      return NextResponse.json({ ok: true, processed: 1, scanId: (result as any).scanId, jobId: (result as any).jobId });
    }

    return NextResponse.json({ ok: false, processed: 1, scanId: (result as any).scanId, jobId: (result as any).jobId, error: (result as any).error }, { status: 500 });
  } finally {
    lock.release();
  }
}

// Support POST too (useful for manual triggers).
export async function POST(req: Request) {
  return GET(req);
}
