# Accessibility Lawsuit Shield — Web App (Next.js)

Next.js App Router App (UI + API routes) for **Accessibility Lawsuit Shield (DE)**.

## Prereqs
- Node.js (recommended: Node 20+)
- Docker (for local Postgres via docker-compose)
- Stripe CLI (optional, for local webhook testing)

## Local setup

### 1) Install deps
```bash
cd web
npm install
```

### 2) Start Postgres (Docker)
```bash
cd web
docker compose up -d
```
This exposes Postgres on `localhost:54325` with:
- user: `als`
- password: `als`
- db: `als`

### 3) Configure env
Copy example env and fill in secrets:
```bash
cp .env.example .env.local
```
Key vars:
- `DATABASE_URL` (defaults to docker-compose port 54325)
- `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Stripe price ids: `STRIPE_PRICE_MINI|STANDARD|PLUS`
- `NEXT_PUBLIC_APP_URL`

### 4) Prisma
Generate client + run migrations:
```bash
npx prisma generate
npx prisma migrate dev
```

### 5) Run dev server
```bash
npm run dev
```
Open:
- http://localhost:3000

## API endpoints (current)
- `POST /api/scan` — Playwright + axe scan for a given URL.
  - body: `{ "url": "https://example.com" }`
  - returns: `{ scanId, url, totals, sampleFinding }`

## Troubleshooting

### `/api/scan` returns 500
Common causes:
- Playwright browser not installed (run `npx playwright install`)
- Axe injection failures on some sites; we inject `axe-core/axe.min.js` from `node_modules` to avoid bundler issues.
- Timeouts / blocked navigation (CSP, bot protection).

### DB connection errors
- Ensure docker container is running: `docker ps`
- Ensure `DATABASE_URL` points to `localhost:54325`.

## Notes
- This product provides **technical findings** (WCAG/EN 301 549 mapping) and remediation guidance — **no legal advice**.
