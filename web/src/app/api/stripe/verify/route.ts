/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

export const runtime = "nodejs";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2025-12-15.clover" });
}

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return null;
  return new ConvexHttpClient(url);
}

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "stripe_not_configured" }, { status: 500 });

  const convex = getConvexClient();
  if (!convex) return NextResponse.json({ error: "convex_not_configured" }, { status: 500 });

  const body = (await req.json()) as { scanId?: string };
  const scanId = String(body.scanId || "").trim();
  if (!scanId) return NextResponse.json({ error: "missing_scanId" }, { status: 400 });

  // Find a completed, paid Checkout Session for this scanId.
  // This avoids relying on webhooks in localhost environments.
  // Stripe SDK versions differ; `sessions.search` is not always available.
  // So we list recent sessions and filter by metadata.
  let session: Stripe.Checkout.Session | null = null;
  try {
    const res = await stripe.checkout.sessions.list({ limit: 50 });
    session =
      res.data
        .filter((s) => (s.metadata?.scanId || "") === scanId)
        .sort((a, b) => (b.created ?? 0) - (a.created ?? 0))[0] ?? null;
  } catch (e: any) {
    return NextResponse.json({ error: "stripe_list_failed", details: String(e?.message || e) }, { status: 500 });
  }

  if (!session) return NextResponse.json({ error: "no_completed_session" }, { status: 404 });

  const paymentStatus = session.payment_status;
  if (paymentStatus !== "paid") {
    return NextResponse.json({ error: "not_paid", paymentStatus }, { status: 409 });
  }

  const tier = (session.metadata?.tier as string | undefined) ?? undefined;

  await convex.mutation(api.scans.markPaid, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scanId: scanId as any,
    tier,
  });

  await convex.mutation((api as any).scanJobs.enqueue, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scanId: scanId as any,
  });

  return NextResponse.json({ ok: true, verified: true, tier: tier ?? null, sessionId: session.id });
}
