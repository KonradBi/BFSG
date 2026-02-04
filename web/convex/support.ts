import { v } from "convex/values";
import { internalMutation, internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

const DELAY_MS = 5 * 60 * 1000;

const URGENT_RE = /(refund|chargeback|r[üu]ckzahlung|r[üu]ckerstattung|anwalt|abmahnung|klage|datenschutz|dsgvo|security|hack|exploit|zahlung|stripe|kreditkarte|payment)/i;

function isUrgent(subject?: string, text?: string) {
  const hay = `${subject || ""}\n${text || ""}`;
  return URGENT_RE.test(hay);
}

export const ingest = internalMutation({
  args: {
    messageId: v.string(),
    from: v.string(),
    subject: v.optional(v.string()),
    text: v.optional(v.string()),
    raw: v.optional(v.any()),
    receivedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("supportMessages")
      .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
      .unique();

    const urgent = isUrgent(args.subject, args.text);

    if (!existing) {
      await ctx.db.insert("supportMessages", {
        messageId: args.messageId,
        from: args.from,
        subject: args.subject,
        text: args.text,
        raw: args.raw,
        urgent,
        receivedAt: args.receivedAt,
        firstSeenAt: Date.now(),
        status: urgent ? "SKIPPED" : "NEW",
      });

      if (!urgent) {
        await ctx.scheduler.runAfter(DELAY_MS, (internal as any).support.sendAutoReply, {
          messageId: args.messageId,
        });
      }

      return { created: true, urgent };
    }

    // Update stored payload (best-effort) but do not reschedule.
    await ctx.db.patch(existing._id, {
      from: args.from,
      subject: args.subject,
      text: args.text,
      raw: args.raw,
      urgent,
      receivedAt: args.receivedAt,
    });

    return { created: false, urgent };
  },
});

export const sendAutoReply: any = internalAction({
  args: {
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.AGENTMAIL_API_KEY;
    const inboxId = process.env.AGENTMAIL_INBOX_ID;
    if (!apiKey || !inboxId) return { ok: false, error: "agentmail_not_configured" };

    const msg = await ctx.runQuery((internal as any).support.getByMessageId, { messageId: args.messageId });
    if (!msg) return { ok: false, error: "not_found" };
    if (msg.urgent) return { ok: true, skipped: true, reason: "urgent" };
    if (msg.status !== "NEW") return { ok: true, skipped: true, reason: "already_processed" };

    // Ensure at least 5 minutes have passed (best-effort safety).
    // We schedule from the ingest mutation; if this ever runs early, just skip.
    if (Date.now() - msg.firstSeenAt < DELAY_MS) {
      return { ok: true, skipped: true, reason: "too_early" };
    }

    const subject = msg.subject || "Ihre Anfrage";
    const replySubject = subject.toLowerCase().startsWith("re:") ? subject : `Re: ${subject}`;

    const signatureText = `\n\nViele Grüße\nBFSG‑WebCheck Support\n${inboxId}\nhttps://bfsg-webcheck.de\n\nHinweis: Technischer Service, keine Rechtsberatung.`;

    const text =
      "Danke für Ihre Nachricht!\n\n" +
      "Wir melden uns in Kürze. Damit wir schnell helfen können, schicken Sie uns bitte:\n" +
      "- die URL der Website\n" +
      "- was genau Sie erreichen möchten (BFSG/WCAG)\n" +
      "- falls vorhanden: Screenshot/Fehlermeldung\n" +
      signatureText;

    const html =
      "<p>Danke für Ihre Nachricht!</p>" +
      "<p>Wir melden uns in Kürze. Damit wir schnell helfen können, schicken Sie uns bitte:</p>" +
      "<ul><li>die URL der Website</li><li>was genau Sie erreichen möchten (BFSG/WCAG)</li><li>falls vorhanden: Screenshot/Fehlermeldung</li></ul>" +
      `<p>Viele Grüße<br><strong>BFSG‑WebCheck Support</strong><br>${inboxId}<br><a href=\"https://bfsg-webcheck.de\">https://bfsg-webcheck.de</a></p>` +
      "<p style=\"font-size:12px;color:#64748b\">Hinweis: Technischer Service, keine Rechtsberatung.</p>";

    // Send via AgentMail API
    const res = await fetch(`https://api.agentmail.to/v0/inboxes/${encodeURIComponent(inboxId)}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: [msg.from],
        subject: replySubject,
        text,
        html,
        headers: { "Auto-Submitted": "auto-replied" },
        labels: ["support", "auto-reply"],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `agentmail_send_failed_${res.status}`, body };
    }

    await ctx.runMutation((internal as any).support.markReplied, { messageId: args.messageId });
    return { ok: true };
  },
});

export const getByMessageId = internalQuery({
  args: { messageId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("supportMessages")
      .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
      .unique();
    return existing;
  },
});

export const markReplied = internalMutation({
  args: { messageId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("supportMessages")
      .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
      .unique();
    if (!existing) return;
    await ctx.db.patch(existing._id, {
      repliedAt: Date.now(),
      status: "REPLIED",
    });
  },
});
