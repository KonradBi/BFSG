import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsertForScan = mutation({
  args: {
    scanId: v.id("scans"),
    userId: v.optional(v.string()),
    tier: v.optional(v.string()),
    plan: v.optional(v.object({ maxPages: v.number(), maxWallTimeMs: v.number(), maxPerPageTimeMs: v.number() })),
    discoveredPages: v.optional(v.number()),
    scannedPages: v.optional(v.number()),
    totals: v.optional(v.object({ p0: v.number(), p1: v.number(), p2: v.number(), total: v.number() })),
    sampleFinding: v.optional(
      v.object({
        title: v.string(),
        severity: v.union(v.literal("P0"), v.literal("P1"), v.literal("P2")),
        hint: v.string(),
      })
    ),
    findings: v.optional(v.array(v.any())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db.query("reports").withIndex("by_scan", (q) => q.eq("scanId", args.scanId)).first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        userId: args.userId ?? existing.userId,
        tier: args.tier ?? existing.tier,
        plan: args.plan ?? existing.plan,
        discoveredPages: args.discoveredPages ?? existing.discoveredPages,
        scannedPages: args.scannedPages ?? existing.scannedPages,
        totals: args.totals ?? existing.totals,
        sampleFinding: args.sampleFinding ?? existing.sampleFinding,
        findings: args.findings ?? existing.findings,
        updatedAt: now,
      });
      return { ok: true, reportId: existing._id, created: false };
    }

    const reportId = await ctx.db.insert("reports", {
      scanId: args.scanId,
      userId: args.userId,
      tier: args.tier,
      plan: args.plan,
      discoveredPages: args.discoveredPages,
      scannedPages: args.scannedPages,
      totals: args.totals,
      sampleFinding: args.sampleFinding,
      findings: args.findings,
      createdAt: now,
      updatedAt: now,
    });

    return { ok: true, reportId, created: true };
  },
});

export const getByScan = query({
  args: { scanId: v.id("scans") },
  handler: async (ctx, { scanId }) => {
    return await ctx.db.query("reports").withIndex("by_scan", (q) => q.eq("scanId", scanId)).first();
  },
});
