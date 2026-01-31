import { mutation } from "./_generated/server";
import { v } from "convex/values";

function stableKey(f: any) {
  // Key used for diffing between scans.
  return [f?.ruleId, f?.pageUrl, f?.selector].map((x) => String(x || "")).join("|");
}

function capString(s: unknown, max = 800) {
  const str = String(s ?? "");
  if (str.length <= max) return str;
  return str.slice(0, max) + "…";
}

function sanitizeFinding(f: any) {
  const out: any = { ...f };
  // Minimize data stored.
  if (out.snippet) out.snippet = capString(out.snippet, 1200);
  if (out.failureSummary) out.failureSummary = capString(out.failureSummary, 800);
  if (out.title) out.title = capString(out.title, 180);
  if (out.description) out.description = capString(out.description, 600);
  if (Array.isArray(out.fixSteps)) out.fixSteps = out.fixSteps.slice(0, 5).map((s: any) => capString(s, 220));
  return out;
}

export const storeResults = mutation({
  args: {
    scanId: v.id("scans"),
    totals: v.object({ p0: v.number(), p1: v.number(), p2: v.number(), total: v.number() }),
    sampleFinding: v.object({
      title: v.string(),
      severity: v.union(v.literal("P0"), v.literal("P1"), v.literal("P2")),
      hint: v.string(),
    }),
    findings: v.array(v.any()),
  },
  handler: async (ctx, { scanId, totals, sampleFinding, findings }) => {
    const now = Date.now();
    const scan = await ctx.db.get(scanId);
    if (!scan) throw new Error("scan_not_found");

    // Hard cap findings stored (server-side safety)
    const capped = findings.slice(0, 500).map(sanitizeFinding);

    let diffSummary: { fixed: number; new: number; persisting: number } | null = null;

    if (scan.previousScanId) {
      const prev = await ctx.db.get(scan.previousScanId);
      if (prev?.isPaid && Array.isArray(prev.findings)) {
        const prevSet = new Set((prev.findings as any[]).map(stableKey));
        const nextSet = new Set(capped.map(stableKey));

        let persisting = 0;
        for (const k of nextSet) if (prevSet.has(k)) persisting++;

        let fixed = 0;
        for (const k of prevSet) if (!nextSet.has(k)) fixed++;

        let added = 0;
        for (const k of nextSet) if (!prevSet.has(k)) added++;

        diffSummary = { fixed, new: added, persisting };
      }
    }

    await ctx.db.patch(scanId, {
      totals,
      sampleFinding,
      findings: capped,
      diffSummary: diffSummary ?? undefined,
      updatedAt: now,
    });

    return { ok: true, stored: capped.length, diffSummary };
  },
});
