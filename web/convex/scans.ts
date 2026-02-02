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
      userId: undefined,
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

export const createQueued = mutation({
  args: {
    url: v.string(),
    accessToken: v.string(),
    authorizedToScan: v.boolean(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, { url, accessToken, authorizedToScan, userId }) => {
    const now = Date.now();
    const scanId = await ctx.db.insert("scans", {
      url,
      accessToken,
      authorizedToScan,
      userId,
      status: "QUEUED",
      isPaid: false,
      createdAt: now,
      updatedAt: now,
    });
    return { scanId };
  },
});

export const get = query({
  args: { scanId: v.id("scans") },
  handler: async (ctx, { scanId }) => {
    return await ctx.db.get(scanId);
  },
});

export const listByUserId = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { userId, limit }) => {
    const n = Math.max(1, Math.min(100, limit ?? 50));
    // No index yet; filter is acceptable for current scale.
    const rows = await ctx.db
      .query("scans")
      .filter((q) => q.eq(q.field("userId"), userId))
      .order("desc")
      .take(n);
    return rows;
  },
});

function planForTier(tier?: string | null) {
  const t = String(tier || "mini");
  if (t === "plus") {
    return { maxPages: 50, maxWallTimeMs: 20 * 60_000, maxPerPageTimeMs: 25_000 };
  }
  if (t === "standard") {
    return { maxPages: 15, maxWallTimeMs: 10 * 60_000, maxPerPageTimeMs: 25_000 };
  }
  // Mini now includes a small multi-page crawl.
  return { maxPages: 5, maxWallTimeMs: 4 * 60_000, maxPerPageTimeMs: 25_000 };
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

// Re-scans are disabled (product decision).
export const createRescan = mutation({
  args: {
    previousScanId: v.id("scans"),
    accessToken: v.string(),
  },
  handler: async () => {
    throw new Error("rescan_disabled");
  },
});
