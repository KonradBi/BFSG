import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  scans: defineTable({
    url: v.string(),

    // Bearer-style token required to read paid reports (MVP authZ without accounts).
    // Optional to keep backward compatibility with older rows.
    accessToken: v.optional(v.string()),

    // User confirmation that they are authorized to scan this website.
    // Optional for backward compatibility.
    authorizedToScan: v.optional(v.boolean()),

    // Optional: link rescans to a previous paid scan for diffing.
    previousScanId: v.optional(v.id("scans")),
    diffSummary: v.optional(
      v.object({
        fixed: v.number(),
        new: v.number(),
        persisting: v.number(),
      })
    ),

    status: v.union(
      v.literal("QUEUED"),
      v.literal("RUNNING"),
      v.literal("SUCCEEDED"),
      v.literal("FAILED")
    ),

    // Paywall / access
    isPaid: v.boolean(),
    paidAt: v.optional(v.number()), // unix ms
    tier: v.optional(v.string()), // mini|standard|plus

    // Plan + progress (for queued/worker runs)
    plan: v.optional(
      v.object({
        maxPages: v.number(),
        maxWallTimeMs: v.number(),
        maxPerPageTimeMs: v.number(),
      })
    ),
    progress: v.optional(
      v.object({
        pagesDone: v.number(),
        pagesTotal: v.number(),
      })
    ),
    pages: v.optional(
      v.array(
        v.object({
          url: v.string(),
          mode: v.union(v.literal("FULL"), v.literal("LIGHT"), v.literal("STATIC")),
          ms: v.number(),
        })
      )
    ),

    // Results (kept bounded)
    totals: v.optional(
      v.object({
        p0: v.number(),
        p1: v.number(),
        p2: v.number(),
        total: v.number(),
      })
    ),
    sampleFinding: v.optional(
      v.object({
        title: v.string(),
        severity: v.union(v.literal("P0"), v.literal("P1"), v.literal("P2")),
        hint: v.string(),
      })
    ),
    findings: v.optional(v.array(v.any())),
    error: v.optional(v.string()),

    createdAt: v.number(), // unix ms
    updatedAt: v.number(), // unix ms
  })
    .index("by_url", ["url"])
    .index("by_paid", ["isPaid"]),

  scanJobs: defineTable({
    scanId: v.id("scans"),

    status: v.union(
      v.literal("QUEUED"),
      v.literal("RUNNING"),
      v.literal("DONE"),
      v.literal("FAILED")
    ),

    attempts: v.number(),
    nextRunAt: v.number(),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status_nextRunAt", ["status", "nextRunAt"])
    .index("by_scan", ["scanId"]),
});
