# Testing

## E2E (Playwright)

Prereqs:
- Convex deployment URL must be available via `NEXT_PUBLIC_CONVEX_URL` (already in `.env.local`).

Run:
```bash
cd web
npm run test:e2e
```

Notes:
- E2E uses a **test fixture mode** (no real Playwright scan) by setting:
  - `TEST_SCAN_FIXTURES=1`
  - `NODE_ENV=test`
- Stripe webhook is tested via a safe dev-only bypass:
  - Send header `x-test-bypass-signature: 1` to `/api/stripe/webhook` with JSON `{scanId,tier}`.

## Worker (Queue)

Der **Vollscan** läuft nicht im Web-Request, sondern in einem separaten Worker-Prozess.

Start (2. Terminal):
```bash
cd web
NEXT_PUBLIC_CONVEX_URL=... node scripts/worker.mjs
```

Optional:
```bash
WORKER_POLL_MS=2500 NEXT_PUBLIC_CONVEX_URL=... node scripts/worker.mjs
```
