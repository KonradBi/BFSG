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

export async function POST() {
  // Product decision: no rescans (for any tier). A new scan requires a new purchase.
  return NextResponse.json({ error: "rescan_disabled" }, { status: 403 });
}
