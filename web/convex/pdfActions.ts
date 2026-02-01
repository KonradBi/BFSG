import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const storeForScanIfMissing: any = action({
  args: {
    scanId: v.id("scans"),
    userId: v.optional(v.string()),
    reportId: v.optional(v.id("reports")),
    findingsHash: v.string(),
    pdfBase64: v.string(),
  },
  handler: async (ctx, { scanId, userId, reportId, findingsHash, pdfBase64 }) => {
    const existing = await ctx.runQuery(api.pdfs.getByScanAndHash, { scanId, findingsHash }).catch(() => null);
    if (existing) {
      return { ok: true, pdfId: existing._id, storageId: existing.storageId, url: existing.url, alreadyExisted: true };
    }

    const bytes = Uint8Array.from(Buffer.from(pdfBase64, "base64"));
    const storageId = await ctx.storage.store(new Blob([bytes], { type: "application/pdf" }));

    const inserted = await ctx.runMutation(api.pdfs.insert, {
      scanId,
      reportId,
      userId,
      findingsHash,
      storageId,
    });

    const url = await ctx.storage.getUrl(storageId);
    return { ok: true, pdfId: inserted.pdfId, storageId, url, alreadyExisted: false };
  },
});
