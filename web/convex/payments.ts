import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createOrUpdateFromStripe = mutation({
  args: {
    scanId: v.id("scans"),
    userId: v.optional(v.string()),
    tier: v.string(),
    status: v.union(v.literal("PENDING"), v.literal("PAID"), v.literal("FAILED"), v.literal("REFUNDED")),
    currency: v.optional(v.string()),
    amount: v.optional(v.number()),
    stripeCheckoutSessionId: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existing = args.stripeCheckoutSessionId
      ? await ctx.db
          .query("payments")
          .withIndex("by_stripe_session", (q) => q.eq("stripeCheckoutSessionId", args.stripeCheckoutSessionId))
          .first()
      : null;

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        tier: args.tier,
        userId: args.userId ?? existing.userId,
        currency: args.currency ?? existing.currency,
        amount: args.amount ?? existing.amount,
        stripePaymentIntentId: args.stripePaymentIntentId ?? existing.stripePaymentIntentId,
        updatedAt: now,
      });
      return { ok: true, paymentId: existing._id, created: false };
    }

    const paymentId = await ctx.db.insert("payments", {
      scanId: args.scanId,
      userId: args.userId,
      tier: args.tier,
      currency: args.currency,
      amount: args.amount,
      status: args.status,
      stripeCheckoutSessionId: args.stripeCheckoutSessionId,
      stripePaymentIntentId: args.stripePaymentIntentId,
      createdAt: now,
      updatedAt: now,
    });

    return { ok: true, paymentId, created: true };
  },
});

export const listByScan = query({
  args: { scanId: v.id("scans") },
  handler: async (ctx, { scanId }) => {
    return await ctx.db.query("payments").withIndex("by_scan", (q) => q.eq("scanId", scanId)).order("desc").take(10);
  },
});
