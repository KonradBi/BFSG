import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Data minimization / retention cleanup.
// Deletes scans (and their jobs) older than `olderThanMs`.
export const purgeOldScans = internalMutation({
  args: { olderThanMs: v.number() },
  handler: async (ctx, { olderThanMs }) => {
    const cutoff = Date.now() - olderThanMs;

    // Convex doesn't support a range index here in MVP; we scan a bounded set.
    // Keep it safe by limiting.
    const candidates = await ctx.db.query("scans").order("asc").take(500);

    let deletedScans = 0;
    let deletedJobs = 0;

    for (const scan of candidates) {
      if (scan.updatedAt > cutoff) continue;

      // delete jobs
      const jobs = await ctx.db
        .query("scanJobs")
        .withIndex("by_scan", (q) => q.eq("scanId", scan._id))
        .take(50);

      for (const j of jobs) {
        await ctx.db.delete(j._id);
        deletedJobs++;
      }

      await ctx.db.delete(scan._id);
      deletedScans++;
    }

    return { ok: true, deletedScans, deletedJobs, cutoff };
  },
});
