# Accessibility Lawsuit Shield (DE) — Projektplan (Profi-Setup)

## Ziel (MVP → V1)
Ein **Website-Scanner** für Barrierefreiheit (WCAG) für Deutschland, der:
- Probleme **findet** (automatisierte Checks + Screenshot/DOM Belege)
- Risiko **verständlich erklärt** (ohne Rechtsberatung)
- konkrete **Fix-Rezepte** liefert (Snippets/Tickets/Priorisierung)
- für Agenturen **skalierbar** ist (Multi-Site, White-Label Reports)

> Disclaimer (überall): **keine Rechtsberatung**. Wir reporten technische Standards (WCAG/EN 301 549) + Best Practices.

---

## Milestones

### M0 — Fundament (1–2 Tage)
- Repo/Monorepo-Struktur
- Auth (Google)
- Stripe Subscriptions + Webhooks
- DB Schema + Multi-Tenant Modell
- Minimal UI: Landing → Login → Dashboard

### M1 — Scanner MVP (3–5 Tage)
- „Scan now“ Button pro Site
- Headless Scan (axe-core via Playwright) + basic Lighthouse accessibility optional
- Findings speichern (JSON) + Screenshot
- Report UI: Priorität P0–P2, How-to-fix, Copy Snippet

### M2 — Agentur Features (5–10 Tage)
- Multi-Site (bis 25)
- White-label PDF Export
- Change Tracking (Delta: neu/behoben)
- Alerting per Email

### M3 — V1 (2–4 Wochen)
- Tickets Export (Jira/Trello/Linear)
- Client Portal (read-only)
- Scheduled scans (daily/weekly)
- Benchmarks, SLA, Audit Trail

---

## Architektur (hochlevel)

**Web App (Next.js App Router)**
- Landing, Pricing, Auth
- Dashboard (Sites, Scans, Findings)
- Admin (Billing)

**API (Next.js Route Handlers)**
- /api/stripe/webhook
- /api/sites
- /api/scans (create, status)

**Worker/Scanner (Node)**
- Läuft als separater Prozess/Job (lokal: `npm run worker`)
- Für Prod: containerized worker (Fly.io/Render) oder serverless queue

**DB (Postgres empfohlen)**
- Users, Orgs, Memberships
- Sites
- Scans
- Findings

**Storage (S3 kompatibel)**
- Screenshots / Reports

---

## Datenmodell (MVP)
- User(id, email, name, image)
- Org(id, name)
- Membership(userId, orgId, role)
- Site(id, orgId, url, name)
- Scan(id, siteId, status, startedAt, finishedAt, toolVersions, summary)
- Finding(id, scanId, severity, ruleId, title, description, helpUrl, selector, snippet, screenshotUrl)

---

## Security / Compliance
- OAuth via Google, Session Cookies
- RBAC: user ∈ org
- Stripe: never trust client; verify webhook signature
- PII: Minimal speichern
- Robots/Rate limits beim Scannen
- Opt-in: „I own this site or have permission to scan“ Checkbox

---

## Deliverables (was du am Ende bekommst)
- Live Demo (lokal + deploy-ready)
- Stripe checkout + manage billing
- Scan reports mit Priorisierung + Fix-Rezept
- DE-spezifisches Copywriting + Pricing
