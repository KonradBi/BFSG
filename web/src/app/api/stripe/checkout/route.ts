import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import Stripe from "stripe";
import { authOptions } from "@/auth";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // Use Stripe account API version (or Stripe SDK default) to avoid invalid/unsupported versions breaking checkout.
  return new Stripe(key);
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

  const { scanId, tier, scanToken, invoice } = (await req.json()) as {
    scanId: string;
    tier: string;
    scanToken?: string;
    invoice?: boolean;
  };
  const price = PRICE_BY_TIER[tier];
  if (!price) return NextResponse.json({ error: "missing_price" }, { status: 400 });

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    `${req.headers.get("x-forwarded-proto") || "https"}://${req.headers.get("x-forwarded-host") || req.headers.get("host")}`;

  // MVP: we pass scanId (+token for client-side access) in metadata.
  // Webhook will mark the scan as paid.
  const wantInvoice = Boolean(invoice);

  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price, quantity: 1 }],

      // Pre-fill email so Stripe can deliver receipts and we can reconcile later.
      customer_email: session.user.email,

      // If the customer wants an invoice (B2B), we need address + (optional) tax ids.
      ...(wantInvoice
        ? {
            invoice_creation: { enabled: true },
            billing_address_collection: "required",
            tax_id_collection: { enabled: true },
            // Persist customer so the invoice can attach address/tax details.
            customer_creation: "always",
            // NOTE: Do NOT set `customer_update` unless you provide `customer`.
            // Otherwise Stripe errors: "customer_update can only be used with customer".
            // Ask for company name explicitly (Stripe's default "name" can be a person).
            custom_fields: [
              {
                key: "company",
                label: { type: "custom", custom: "Firma / Organisation" },
                type: "text",
                optional: false,
              },
            ],
          }
        : {}),

      success_url: `${appUrl}/scan?success=1&scanId=${encodeURIComponent(scanId)}${scanToken ? `&token=${encodeURIComponent(scanToken)}` : ""}`,
      cancel_url: `${appUrl}/scan?canceled=1&scanId=${encodeURIComponent(scanId)}${scanToken ? `&token=${encodeURIComponent(scanToken)}` : ""}`,

      metadata: {
        scanId,
        tier,
        scanToken: scanToken ?? "",
        userEmail: session.user.email,
        invoice: wantInvoice ? "1" : "0",
      },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (err: unknown) {
    // Surface useful error details to logs, and return a safe subset to the client
    // (helps debug env misconfig in prod without exposing secrets).
    console.error("stripe_checkout_create_failed", err);

    const stripeErr = err as Partial<Stripe.errors.StripeError> & { message?: string };

    return NextResponse.json(
      {
        error: "checkout_create_failed",
        stripeMessage: stripeErr?.message || "",
        stripeType: (stripeErr as any)?.type || "",
        stripeCode: (stripeErr as any)?.code || "",
        requestId: (stripeErr as any)?.requestId || "",
      },
      { status: 500 }
    );
  }
}
