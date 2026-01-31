import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import Stripe from "stripe";
import { authOptions } from "@/auth";

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
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "stripe_not_configured" }, { status: 500 });

  const { scanId, tier, scanToken } = (await req.json()) as { scanId: string; tier: string; scanToken?: string };
  const price = PRICE_BY_TIER[tier];
  if (!price) return NextResponse.json({ error: "missing_price" }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // MVP: we pass scanId (+token for client-side access) in metadata.
  // Webhook will mark the scan as paid.
  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price, quantity: 1 }],
    // Pre-fill email so Stripe can deliver receipts and we can reconcile later.
    customer_email: session.user.email,
    success_url: `${appUrl}/scan?success=1&scanId=${encodeURIComponent(scanId)}${scanToken ? `&token=${encodeURIComponent(scanToken)}` : ""}`,
    cancel_url: `${appUrl}/scan?canceled=1&scanId=${encodeURIComponent(scanId)}${scanToken ? `&token=${encodeURIComponent(scanToken)}` : ""}`,
    metadata: { scanId, tier, scanToken: scanToken ?? "", userEmail: session.user.email },
  });

  return NextResponse.json({ url: checkout.url });
}
