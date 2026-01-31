/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

export const runtime = "nodejs";

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return null;
  return new ConvexHttpClient(url);
}

function newAccessToken() {
  return crypto.randomBytes(24).toString("hex");
}

export async function POST(req: Request) {
  const { scanId } = (await req.json()) as { scanId?: string };
  const token = req.headers.get("x-scan-token") || "";

  if (!scanId) return NextResponse.json({ error: "missing_scanId" }, { status: 400 });
  if (!token) return NextResponse.json({ error: "missing_token" }, { status: 401 });

  const convex = getConvexClient();
  if (!convex) return NextResponse.json({ error: "convex_not_configured" }, { status: 500 });

  const scan = await convex.query(api.scans.get, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scanId: scanId as any,
  });
  if (!scan) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (scan.accessToken !== token) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const nextToken = newAccessToken();

  // Create new paid scan linked to previous
  const created = await convex.mutation(api.scans.createRescan, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    previousScanId: scanId as any,
    accessToken: nextToken,
  });

  // Enqueue worker job
  await convex.mutation(api.scanJobs.enqueue, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scanId: created.scanId as any,
  });

  return NextResponse.json({
    scanId: created.scanId,
    scanToken: nextToken,
  });
}
