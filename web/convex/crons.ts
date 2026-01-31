import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Retention policy: purge old scans periodically.
// Configure via RETENTION_DAYS (defaults to 30 days).
const RETENTION_DAYS = Number(process.env.RETENTION_DAYS || 30);
const olderThanMs = Math.max(1, RETENTION_DAYS) * 24 * 60 * 60 * 1000;

crons.daily(
  "purge-old-scans",
  { hourUTC: 3, minuteUTC: 15 },
  (internal as any).maintenance.purgeOldScans,
  { olderThanMs }
);

export default crons;
