/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

export const runtime = "nodejs";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // Use Stripe account API version (or Stripe SDK default) to avoid invalid/unsupported versions breaking webhooks.
  return new Stripe(key);
}

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return null;
  return new ConvexHttpClient(url);
}

type ProcessedEvent = { processedAt: number };
const PROCESSED_EVENTS: Map<string, ProcessedEvent> =
  // eslint-disable-next-line no-var
  (globalThis as any).__als_stripe_events || new Map();
// eslint-disable-next-line no-var
(globalThis as any).__als_stripe_events = PROCESSED_EVENTS;
const MAX_PROCESSED_EVENTS = 2000;

function alreadyProcessed(eventId: string) {
  return PROCESSED_EVENTS.has(eventId);
}

function markProcessed(eventId: string) {
  PROCESSED_EVENTS.set(eventId, { processedAt: Date.now() });
  if (PROCESSED_EVENTS.size <= MAX_PROCESSED_EVENTS) return;
  const entries = Array.from(PROCESSED_EVENTS.entries()).sort((a, b) => a[1].processedAt - b[1].processedAt);
  for (const [id] of entries.slice(0, Math.floor(MAX_PROCESSED_EVENTS / 4))) {
    PROCESSED_EVENTS.delete(id);
  }
}

function isValidScanId(scanId: unknown) {
  if (typeof scanId !== "string") return false;
  const trimmed = scanId.trim();
  return trimmed.length >= 8 && !/\s/.test(trimmed);
}

export async function POST(req: Request) {
  // TEST BYPASS: allow marking scan as paid without Stripe signature.
  // Enabled only when explicitly requested.
  if (process.env.PLAYWRIGHT_TEST === "1" && req.headers.get("x-test-bypass-signature") === "1") {
    const convex = getConvexClient();
    if (!convex) return NextResponse.json({ error: "convex_not_configured" }, { status: 500 });

    const body = (await req.json()) as { scanId?: string; tier?: string };
    if (!body.scanId) return NextResponse.json({ error: "missing_scanId" }, { status: 400 });

    await convex.mutation(api.scans.markPaid, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      scanId: body.scanId as any,
      tier: body.tier ?? undefined,
    });

    await convex.mutation((api as any).scanJobs.enqueue, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      scanId: body.scanId as any,
    });

    return NextResponse.json({ received: true, bypass: true });
  }

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "stripe_not_configured" }, { status: 500 });

  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await req.text();

  if (!sig || !secret) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err: any) {
    return NextResponse.json({ error: "invalid_signature", details: String(err?.message || err) }, { status: 400 });
  }

  if (event?.id && alreadyProcessed(event.id)) {
    return NextResponse.json({ received: true, deduped: true });
  }

  // Mark scan as paid (idempotent)
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode !== "payment" || session.payment_status !== "paid") {
      return NextResponse.json({ received: true, ignored: "not_paid" });
    }
    const scanId = session.metadata?.scanId;
    const tier = session.metadata?.tier;

    const convex = getConvexClient();
    if (!convex) {
      return NextResponse.json({ error: "convex_not_configured" }, { status: 500 });
    }

    if (isValidScanId(scanId)) {
      const scan = await convex
        .query(api.scans.get, {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          scanId: scanId as any,
        })
        .catch(() => null);
      if (!scan) return NextResponse.json({ received: true, ignored: "scan_not_found" });

      // Mark scan as paid
      await convex.mutation(api.scans.markPaid, {
        // Convex document IDs are strings at runtime.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        scanId: scanId as any,
        tier: tier ?? undefined,
      });

      // Store payment record (proper data model)
      try {
        const userId = (scan as any)?.userId as string | undefined;

        await convex.mutation((api as any).payments.createOrUpdateFromStripe, {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          scanId: scanId as any,
          userId,
          tier: tier ?? (scan as any)?.tier ?? "mini",
          status: "PAID",
          currency: (session.currency as string | undefined) ?? undefined,
          amount: (session.amount_total as number | undefined) ?? undefined,
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId: (session.payment_intent as string | null) ?? undefined,
        });
      } catch {
        // non-fatal
      }

      // enqueue worker job (idempotent)
      await convex.mutation((api as any).scanJobs.enqueue, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        scanId: scanId as any,
      });

      if (event?.id) markProcessed(event.id);
    }
  }

  return NextResponse.json({ received: true });
}
