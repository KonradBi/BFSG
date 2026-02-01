import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Simple queue (polling). Intended for a single worker with concurrency=1.

export const enqueue = mutation({
  args: {
    scanId: v.id("scans"),
  },
  handler: async (ctx, { scanId }) => {
    const now = Date.now();

    // If a job already exists and is not DONE, keep it (idempotent).
    const existing = await ctx.db
      .query("scanJobs")
      .withIndex("by_scan", (q) => q.eq("scanId", scanId))
      .order("desc")
      .first();

    if (existing && existing.status !== "DONE") {
      // Re-queue if it was FAILED
      if (existing.status === "FAILED") {
        await ctx.db.patch(existing._id, {
          status: "QUEUED",
          nextRunAt: now,
          updatedAt: now,
        });
      }
      return { ok: true, jobId: existing._id, alreadyExisted: true };
    }

    const scan = await ctx.db.get(scanId);
    const jobId = await ctx.db.insert("scanJobs", {
      scanId,
      userId: (scan as any)?.userId,
      status: "QUEUED",
      attempts: 0,
      nextRunAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return { ok: true, jobId };
  },
});

const LEASE_MS = 5 * 60_000;

export const claimNext = mutation({
  args: {
    // Optional: only claim jobs scheduled up to this time.
    now: v.optional(v.number()),
  },
  handler: async (ctx, { now }) => {
    const t = now ?? Date.now();

    // Global concurrency = 1: if a RUNNING job is still within lease, do not start another.
    const running = await ctx.db
      .query("scanJobs")
      .withIndex("by_status_nextRunAt", (q) => q.eq("status", "RUNNING"))
      .order("desc")
      .first();

    if (running) {
      const stale = t - running.updatedAt > LEASE_MS;
      if (!stale) return null;
      // Lease expired: re-queue
      await ctx.db.patch(running._id, {
        status: "QUEUED",
        nextRunAt: t,
        updatedAt: t,
      });
    }

    // Find the next queued job.
    const job = await ctx.db
      .query("scanJobs")
      .withIndex("by_status_nextRunAt", (q) => q.eq("status", "QUEUED").lte("nextRunAt", t))
      .order("asc")
      .first();

    if (!job) return null;

    // Per-user concurrency = 1.
    if (job.userId) {
      const userRunning = await ctx.db
        .query("scanJobs")
        .withIndex("by_status_user", (q) => q.eq("status", "RUNNING").eq("userId", job.userId))
        .first();
      if (userRunning) return null;
    }

    await ctx.db.patch(job._id, {
      status: "RUNNING",
      attempts: job.attempts + 1,
      updatedAt: t,
    });

    const scan = await ctx.db.get(job.scanId);
    if (!scan) {
      // Scan deleted? Mark job failed.
      await ctx.db.patch(job._id, { status: "FAILED", updatedAt: t });
      return null;
    }

    return {
      jobId: job._id,
      scanId: job.scanId,
      scan,
      attempts: job.attempts + 1,
    };
  },
});

export const complete = mutation({
  args: {
    jobId: v.id("scanJobs"),
  },
  handler: async (ctx, { jobId }) => {
    const now = Date.now();
    const job = await ctx.db.get(jobId);
    if (!job) throw new Error("job_not_found");

    await ctx.db.patch(jobId, { status: "DONE", updatedAt: now });
    return { ok: true };
  },
});

export const fail = mutation({
  args: {
    jobId: v.id("scanJobs"),
    error: v.string(),
  },
  handler: async (ctx, { jobId, error }) => {
    const now = Date.now();
    const job = await ctx.db.get(jobId);
    if (!job) throw new Error("job_not_found");

    // Backoff: 30s * attempts (capped)
    const delayMs = Math.min(5 * 60_000, 30_000 * Math.max(1, job.attempts));
    const nextRunAt = now + delayMs;

    // If too many attempts, mark permanently failed.
    const tooMany = job.attempts >= 3;

    await ctx.db.patch(jobId, {
      status: tooMany ? "FAILED" : "QUEUED",
      nextRunAt,
      updatedAt: now,
    });

    // Also store error on the scan for UI visibility
    const scan = await ctx.db.get(job.scanId);
    if (scan) {
      await ctx.db.patch(job.scanId, {
        status: tooMany ? "FAILED" : scan.status,
        error,
        updatedAt: now,
      });
    }

    return { ok: true, nextRunAt, failedPermanently: tooMany };
  },
});

export const listQueued = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const lim = Math.min(50, Math.max(1, limit ?? 10));
    return await ctx.db
      .query("scanJobs")
      .withIndex("by_status_nextRunAt", (q) => q.eq("status", "QUEUED"))
      .order("asc")
      .take(lim);
  },
});

export const getStatus = query({
  args: { jobId: v.id("scanJobs") },
  handler: async (ctx, { jobId }) => {
    const job = await ctx.db.get(jobId);
    if (!job) return null;
    const scan = await ctx.db.get(job.scanId);
    return { job, scan };
  },
});
