import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

export const runtime = "nodejs";

function getConvexClient() {
  const url = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return null;
  return new ConvexHttpClient(url);
}

function getTokenFromRequest(req: Request) {
  try {
    const u = new URL(req.url);
    return u.searchParams.get("token") || req.headers.get("x-agentmail-token") || "";
  } catch {
    return req.headers.get("x-agentmail-token") || "";
  }
}

function extract(obj: any) {
  // AgentMail webhook payloads may vary; we try a few common shapes.
  const msg = obj?.message || obj?.data?.message || obj?.event?.message || obj;
  const messageId = msg?.message_id || msg?.id || obj?.message_id || obj?.id;
  const from = msg?.from?.[0]?.email || msg?.from?.email || msg?.from || "";
  const subject = msg?.subject || "";
  const text = msg?.text || msg?.snippet || msg?.preview || "";
  const receivedAt =
    (typeof msg?.created_at === "string" ? Date.parse(msg.created_at) : undefined) ||
    (typeof msg?.received_at === "string" ? Date.parse(msg.received_at) : undefined) ||
    Date.now();

  return { messageId: String(messageId || ""), from: String(from || ""), subject, text, receivedAt, raw: obj };
}

export async function POST(req: Request) {
  const expected = process.env.AGENTMAIL_WEBHOOK_TOKEN || "";
  const token = getTokenFromRequest(req);
  if (!expected || token !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const convex = getConvexClient();
  if (!convex) return NextResponse.json({ error: "convex_not_configured" }, { status: 500 });

  const body = (await req.json().catch(() => ({}))) as any;
  const { messageId, from, subject, text, receivedAt, raw } = extract(body);

  if (!messageId || !from) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  await convex.mutation((api as any).support.ingest, {
    messageId,
    from,
    subject,
    text,
    receivedAt,
    raw,
  });

  return NextResponse.json({ ok: true });
}
