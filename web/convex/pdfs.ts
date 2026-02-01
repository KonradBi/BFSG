import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getLatestByScan = query({
  args: { scanId: v.id("scans") },
  handler: async (ctx, { scanId }) => {
    const pdf = await ctx.db
      .query("pdfs")
      .withIndex("by_scan", (q) => q.eq("scanId", scanId))
      .order("desc")
      .first();
    if (!pdf) return null;
    const url = await ctx.storage.getUrl(pdf.storageId);
    return { ...pdf, url };
  },
});

export const getByScanAndHash = query({
  args: { scanId: v.id("scans"), findingsHash: v.string() },
  handler: async (ctx, { scanId, findingsHash }) => {
    const pdf = await ctx.db
      .query("pdfs")
      .withIndex("by_scan", (q) => q.eq("scanId", scanId))
      .filter((q) => q.eq(q.field("findingsHash"), findingsHash))
      .first();
    if (!pdf) return null;
    const url = await ctx.storage.getUrl(pdf.storageId);
    return { ...pdf, url };
  },
});

export const insert = mutation({
  args: {
    scanId: v.id("scans"),
    reportId: v.optional(v.id("reports")),
    userId: v.optional(v.string()),
    findingsHash: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { scanId, reportId, userId, findingsHash, storageId }) => {
    const now = Date.now();
    const pdfId = await ctx.db.insert("pdfs", {
      scanId,
      reportId,
      userId,
      findingsHash,
      storageId,
      createdAt: now,
    });
    return { ok: true, pdfId };
  },
});
