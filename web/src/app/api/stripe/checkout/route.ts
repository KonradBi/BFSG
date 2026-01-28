import { NextResponse } from "next/server";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2025-12-15.clover" });
}

const PRICE_BY_TIER: Record<string, string | undefined> = {
  mini: process.env.STRIPE_PRICE_MINI,
  standard: process.env.STRIPE_PRICE_STANDARD,
  plus: process.env.STRIPE_PRICE_PLUS,
};

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "stripe_not_configured" }, { status: 500 });

  const { scanId, tier } = (await req.json()) as { scanId: string; tier: string };
  const price = PRICE_BY_TIER[tier];
  if (!price) return NextResponse.json({ error: "missing_price" }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // MVP: we only pass scanId in metadata; webhook will mark paid
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price, quantity: 1 }],
    success_url: `${appUrl}/scan?success=1&scanId=${encodeURIComponent(scanId)}`,
    cancel_url: `${appUrl}/scan?canceled=1&scanId=${encodeURIComponent(scanId)}`,
    metadata: { scanId, tier },
  });

  return NextResponse.json({ url: session.url });
}
