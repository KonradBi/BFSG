import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    url: v.string(),
    accessToken: v.string(),
    authorizedToScan: v.boolean(),
    previousScanId: v.optional(v.id("scans")),
    totals: v.optional(
      v.object({ p0: v.number(), p1: v.number(), p2: v.number(), total: v.number() })
    ),
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
    const id = await ctx.db.insert("scans", {
      url: args.url,
      accessToken: args.accessToken,
      authorizedToScan: args.authorizedToScan,
      previousScanId: args.previousScanId,
      status: "SUCCEEDED",
      isPaid: false,
      totals: args.totals,
      sampleFinding: args.sampleFinding,
      findings: args.findings,
      createdAt: now,
      updatedAt: now,
    });
    return { scanId: id };
  },
});

export const get = query({
  args: { scanId: v.id("scans") },
  handler: async (ctx, { scanId }) => {
    return await ctx.db.get(scanId);
  },
});

function planForTier(tier?: string | null) {
  const t = String(tier || "mini");
  if (t === "plus") {
    return { maxPages: 50, maxWallTimeMs: 20 * 60_000, maxPerPageTimeMs: 25_000 };
  }
  if (t === "standard") {
    return { maxPages: 10, maxWallTimeMs: 7 * 60_000, maxPerPageTimeMs: 25_000 };
  }
  return { maxPages: 1, maxWallTimeMs: 2 * 60_000, maxPerPageTimeMs: 25_000 };
}

export const markPaid = mutation({
  args: {
    scanId: v.id("scans"),
    tier: v.optional(v.string()),
  },
  handler: async (ctx, { scanId, tier }) => {
    const now = Date.now();
    const scan = await ctx.db.get(scanId);
    if (!scan) throw new Error("scan_not_found");

    const resolvedTier = tier ?? scan.tier ?? "mini";
    const plan = planForTier(resolvedTier);

    if (scan.isPaid) {
      // idempotent
      return { ok: true, alreadyPaid: true };
    }

    await ctx.db.patch(scanId, {
      isPaid: true,
      paidAt: now,
      tier: resolvedTier,
      plan,
      status: "QUEUED",
      progress: { pagesDone: 0, pagesTotal: plan.maxPages },
      pages: [],
      updatedAt: now,
    });

    return { ok: true };
  },
});

export const setStatus = mutation({
  args: {
    scanId: v.id("scans"),
    status: v.union(
      v.literal("QUEUED"),
      v.literal("RUNNING"),
      v.literal("SUCCEEDED"),
      v.literal("FAILED")
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { scanId, status, error }) => {
    const now = Date.now();
    const scan = await ctx.db.get(scanId);
    if (!scan) throw new Error("scan_not_found");

    await ctx.db.patch(scanId, {
      status,
      error: error ?? scan.error,
      updatedAt: now,
    });

    return { ok: true };
  },
});

export const updateProgress = mutation({
  args: {
    scanId: v.id("scans"),
    pagesDone: v.number(),
    pagesTotal: v.number(),
    pages: v.optional(
      v.array(
        v.object({
          url: v.string(),
          mode: v.union(v.literal("FULL"), v.literal("LIGHT"), v.literal("STATIC")),
          ms: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, { scanId, pagesDone, pagesTotal, pages }) => {
    const now = Date.now();
    const scan = await ctx.db.get(scanId);
    if (!scan) throw new Error("scan_not_found");

    await ctx.db.patch(scanId, {
      progress: { pagesDone, pagesTotal },
      pages: pages ?? scan.pages ?? [],
      updatedAt: now,
    });

    return { ok: true };
  },
});

export const createRescan = mutation({
  args: {
    previousScanId: v.id("scans"),
    accessToken: v.string(),
  },
  handler: async (ctx, { previousScanId, accessToken }) => {
    const now = Date.now();
    const prev = await ctx.db.get(previousScanId);
    if (!prev) throw new Error("scan_not_found");
    if (!prev.isPaid) throw new Error("previous_scan_not_paid");

    // MVP policy: only Plus includes Re-Scan.
    if ((prev.tier ?? "mini") !== "plus") throw new Error("tier_not_allowed");

    const plan = planForTier(prev.tier ?? "mini");

    const scanId = await ctx.db.insert("scans", {
      url: prev.url,
      accessToken,
      authorizedToScan: prev.authorizedToScan,
      previousScanId: previousScanId,
      status: "QUEUED",
      isPaid: true,
      paidAt: now,
      tier: prev.tier,
      plan,
      progress: { pagesDone: 0, pagesTotal: plan.maxPages },
      pages: [],
      createdAt: now,
      updatedAt: now,
    });

    return { scanId };
  },
});
