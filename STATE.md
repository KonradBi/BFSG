# Accessibility Lawsuit Shield — Project State

This file is the “anchor” so we don’t lose context when chat history is compacted.

## What this repo is
An AI-assisted accessibility scanner (DE) for SMBs/agencies:
- run automated WCAG-ish checks (Playwright + axe)
- show prioritized findings (P0–P2)
- provide fix guidance (no legal advice)

## Structure
- `projects/accessibility-lawsuit-shield/web/` — Next.js app (UI + API routes)

## Local stack
- Next dev server (Turbopack)
- Postgres via `web/docker-compose.yml` (port **54325**)

## Key env vars
See `web/.env.example`.

Important:
- `DATABASE_URL=postgresql://als:als@localhost:54325/als`
- Auth.js / NextAuth: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Stripe price IDs: `STRIPE_PRICE_MINI|STANDARD|PLUS`
- `NEXT_PUBLIC_APP_URL`

## Current implemented pieces (as of 2026-01-28)
- Prisma schema: Users/Orgs/Memberships/Sites/Scans/Findings (+ NextAuth models)
- `POST /api/scan` implemented using Playwright + axe
  - Known issue earlier: axe injection failures in Next/Turbopack context.
  - Fix applied: inject `axe-core/axe.min.js` **by reading file contents from `process.cwd()/node_modules`** and using `page.addScriptTag({ content })`.

## How to run
See `web/README.md` for step-by-step.

## Milestones / Timeline (from chat)
- **Today ~16:00**: Google Login + Stripe payments clean (incl. webhook unlock)
- **Today ~20:00**: End-to-end MVP: Scan → Teaser → Paywall → Payment → full report (incl. PDF)
- **Tomorrow morning**: Polishing (DE copy, edge cases, limits, agency pack)

## Funnel + Pricing (from chat)
Funnel: **Free scan → Teaser → Paywall → Payment → Full report + PDF + Fix snippets**

One-time pricing (TO-GO audit):
- **€29 Mini**: 1 URL, immediate scan, full report + priorities + fix snippets as PDF
- **€59 Standard**: 1 URL + up to 5 key templates (home, product, cart, checkout, contact), PDF
- **€99 Plus**: Standard + re-scan after fixes + “before/after” summary

Optional monitoring subscription:
- **€9/mo**: monthly scan + alerts
- **€19/mo**: weekly + change tracking + PDF export

## Next likely tasks
- Persist scan results to DB (Scan + Finding records) instead of returning only a sample
- Finish end-to-end flow: scan -> teaser -> paywall -> payment -> unlock -> full report
- Add PDF export for the report
- Add limits (rate, scan caps per tier) + edge-case handling
- Consider worker/queue for scans in prod
