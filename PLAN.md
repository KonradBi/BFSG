# Accessibility Lawsuit Shield (DE) — Projektplan (Profi-Setup)

## Aktueller Stand / Entscheidungen
- **Backend/DB:** Wir nutzen **Convex** (statt Postgres/Prisma). TODO: Prisma-Adapter/Schema entfernen & Auth/Stripe/Scans auf Convex umstellen.
- **Regel:** Jeden erfolgreichen Schritt hier in dieser `PLAN.md` dokumentieren (damit wir bei vollem Kontext nicht von vorn anfangen).

## Ziel (MVP → V1)
Ein **Website-Scanner** für Barrierefreiheit (WCAG) für Deutschland, der:
- Probleme **findet** (automatisierte Checks + Screenshot/DOM Belege)
- Risiko **verständlich erklärt** (ohne Rechtsberatung)
- konkrete **Fix-Rezepte** liefert (Snippets/Tickets/Priorisierung)
- für Agenturen **skalierbar** ist (Multi-Site, White-Label Reports)

> Disclaimer (überall): **keine Rechtsberatung**. Wir reporten technische Standards (WCAG/EN 301 549) + Best Practices.

---

## Milestones

## Log (Fortschritt)
- 2026-01-28: `web`-Codebasis ist Next.js (App Router) mit Stripe-Endpoints (`/api/stripe/checkout`, `/api/stripe/webhook`) und Scan-Endpoint (`/api/scan`). Aktuell existiert noch ein Prisma-Setup (generierte Prisma-Models unter `src/generated/prisma` + Prisma deps im `package.json`). Umstellung auf **Convex** steht als nächster Schritt an.
- 2026-01-28: **Convex lokal integriert**: `convex/` angelegt, lokale Deployment gestartet (`.env.local` mit `NEXT_PUBLIC_CONVEX_URL`), `convex/schema.ts` + `convex/scans.ts` erstellt. `POST /api/scan` persistiert Scan-Ergebnis in Convex und liefert `scanId` (Convex Doc ID). Stripe Webhook (`checkout.session.completed`) markiert den Scan in Convex als `isPaid=true` (idempotent). Scan-UI startet jetzt Stripe Checkout statt direkt PDF zu öffnen.
- 2026-01-28: **Unlock-Gating ergänzt**: neuer Endpoint `GET /api/scans/get?scanId=...` lädt Scan aus Convex und gibt Full-Details nur bei `isPaid=true` zurück. `POST /api/scan` liefert jetzt nur noch den Teaser (keine vollständigen Findings im Response). `/scan` lädt nach Stripe-Return via `scanId` den Scan-Status und zeigt bei Paid einen „Freigeschaltet“-Status + „PDF öffnen“.
- 2026-01-28: **Stripe „audit“ Sandbox eingerichtet**: Produkt `Accessibility Audit` + Prices angelegt (EUR 29/59/99; lookup keys `als_mini|als_standard|als_plus`). `.env.local` aktualisiert (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_*`, `STRIPE_WEBHOOK_SECRET`). Webhook via `stripe listen --forward-to http://localhost:3001/api/stripe/webhook` getestet: Event `checkout.session.completed` mit `metadata.scanId`/`tier` setzt in Convex `isPaid=true` und `tier` korrekt.
- 2026-01-28: **Full Report UI (paid) umgesetzt**: `/scan` zeigt bei `isPaid=true` jetzt eine priorisierte Findings-Liste (P0–P2) inkl. Beschreibung, technische Details (Selector/Snippet/Failure Summary), Fix-Rezept (Steps) und Link zur Regel-Referenz + „PDF öffnen“.
- 2026-01-28: **Google Auth integriert (Code + ENV)**: `src/app/api/auth/[...nextauth]/route.ts` (Google Provider, JWT sessions). `src/app/login` Seite erstellt (Sign in/out). `Providers` (SessionProvider) in `layout.tsx` integriert. ENV in `.env.local`: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`, `NEXTAUTH_URL`.

## MVP (heute) — konkrete Checklist (zum Abhaken)

### Bis ~16:00 — Login + Payment + Unlock
- [x] Google Login funktioniert (Auth.js/NextAuth)
- [x] Stripe Checkout Session wird erzeugt (`POST /api/stripe/checkout`)
- [x] Stripe Webhook verifiziert Signatur (`STRIPE_WEBHOOK_SECRET`)
- [x] Webhook setzt **Unlock** für einen Scan (z.B. `Scan.isPaid=true`, `tier`, `paidAt`)
- [x] UI respektiert Unlock (Teaser vor Pay, Full Report nach Pay)

### Bis ~20:00 — End-to-End MVP
- [x] Flow: Scan → Teaser → Paywall → Payment → Full Report
- [x] Findings werden gespeichert (Scan + Findings in **Convex**)
- [x] “Full Report” enthält Priorisierung (P0–P2) + Fix-Hinweise
- [x] PDF Export (state-of-the-art, sauberer Satz; keine Formatierungsfehler) — implementiert als HTML→PDF via Playwright (`GET /api/report/pdf?url=...`).

### Morgen Vormittag — Polishing
- [ ] DE Copy final
- [ ] Edge cases (Timeouts, Bot-Protection, invalid URLs)
- [ ] Limits (pro Tier / Rate Limit)
- [ ] Agency Pack (White-label hooks / Export / multi-site basics)

## E2E Testplan (was wir einmal komplett durchlaufen)
1) `GET /scan` → URL eingeben → `POST /api/scan`
2) Ergebnis: **Teaser** (Totals + 1 Sample finding) + CTA “Freischalten ab €29”
3) Klick “Freischalten” → `POST /api/stripe/checkout` → Redirect zu Stripe
4) Payment success → zurück zu `/scan?success=1&scanId=...`
5) Webhook `checkout.session.completed` markiert Scan als paid
6) Reload/redirect → Full Report sichtbar
7) PDF Download öffnen und checken:
   - Schrift sauber eingebettet / kein kaputtes Kerning
   - Zeilenumbrüche/Hyphenation ok
   - Farben Kontrast ok
   - Tabellen/Listen nicht „zerschossen“
   - Header/Footer, Seitennummern

---

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



Aufgabenstellung für eine autonome KI: Production-Ready Webseite (End-to-End) inkl. Tests, Google Auth, Stripe, UI/UX, Edge-Cases

Rolle & Ziel

Du agierst als autonomer Full-Stack Engineering Agent (Produktionsniveau). Dein Ziel ist es, eine vollständig funktionsfähige, production-ready Webseite zu liefern, inklusive:
	•	stabiler UI/UX
	•	getesteter Kernflows und Edge Cases
	•	funktionierender Google Authentication (OAuth)
	•	funktionierender Stripe Integration (Testmode → später Live-fähig)
	•	sauberem Deployment
	•	nachvollziehbarer Dokumentation für Betrieb/Übergabe

Du arbeitest selbstständig, Schritt für Schritt, und lieferst am Ende ein fertiges Produkt, das ich direkt nutzen kann.

⸻

Autonomie-Regeln (wichtig)
	1.	Arbeite komplett autonom. Stelle nur dann Fragen, wenn du ohne Zugriff auf eine externe Ressource nicht weiterkommst (Credentials, Domain, Accounts, Repo-Zugriff).
	2.	Nutze deine Browser Capabilities, um:
	•	Webseiten abzusurfen
	•	Einstellungen in Google Cloud Console vorzunehmen (OAuth Consent Screen, Credentials, Redirect URLs)
	•	Stripe Dashboard einzurichten (Test Account, Produkte/Preise, Webhooks)
	3.	Du darfst MCPs, Tools, Agents, Skripte oder beliebige Workflows verwenden, solange am Ende alles erfüllt ist.
	4.	Wenn du Zugriff brauchst, melde dich sofort mit einer präzisen Liste:
	•	was genau du brauchst
	•	wofür
	•	wie ich es dir am besten geben soll (z. B. ENV Variablen, Invite ins Repo, Zugriff auf Google Account)

⸻

Deliverable-Definition (wann gilt es als “fertig”)

Das Projekt gilt erst als fertig, wenn:

A) Funktionalität
	•	Google Login funktioniert stabil:
	•	Login
	•	Logout
	•	Session-Handling
	•	sichere Token/Session Speicherung (best practice)
	•	Redirects korrekt
	•	Stripe funktioniert stabil im Testmodus:
	•	Checkout Flow (Subscription oder One-Time — falls nicht festgelegt: Subscription bevorzugt)
	•	erfolgreiche Zahlung → korrekter App-Zustand
	•	Cancel/Failed Payment sauber gehandhabt
	•	Webhooks laufen lokal und im Deployment
	•	Billing-Status wird korrekt gespeichert/angezeigt
	•	UI ist konsistent, responsive und testbar:
	•	Mobile/Tablet/Desktop
	•	Loading/Empty/Error States vorhanden

B) Qualität / Production Readiness
	•	Security Basics:
	•	env secrets, keine Keys im Repo
	•	CSRF/redirect-hardening je nach Stack
	•	rate-limit / basic abuse-protection wo sinnvoll
	•	korrekte CORS/redirect URI Konfiguration
	•	Observability:
	•	sinnvolle Logs
	•	saubere Fehlerseiten
	•	klare Fehlermeldungen (nicht “raw stack traces”)
	•	Performance:
	•	keine offensichtlichen Bottlenecks
	•	Lighthouse grob ok (keine Perfektion nötig, aber keine Katastrophe)

C) Tests (Pflicht)
	•	Automatisierte Tests:
	•	Unit/Integration wo sinnvoll
	•	Mindestens End-to-End Tests der wichtigsten Flows (Login, Checkout, Webhook)
	•	Manuelles Testprotokoll:
	•	Checkliste aller Flows + Edge Cases + Ergebnis

D) Deployment & Übergabe
	•	Live-Deployment vorhanden (z. B. Vercel/Render/Fly.io/Cloud Run — wähle passend)
	•	README, Setup-Anleitung, ENV-Variablen-Liste, Runbook
	•	“Operator Guide”: Was muss ich wo klicken für Google/Stripe live switch später?

⸻

Vorgehensweise (Step-by-Step Plan, den du strikt abarbeitest)

Du arbeitest in Phasen und dokumentierst deine Ergebnisse je Phase.

Phase 0 — Projektannahmen & Auswahl (ohne Rückfragen)

Wenn der Stack nicht vorgegeben ist, nimm diese Default-Entscheidung (produktionstauglich & schnell):
	•	Next.js (App Router) + TypeScript
	•	Auth: NextAuth oder Auth.js (Google Provider)
	•	DB: Postgres (z. B. Supabase/Neon) + Prisma
	•	Stripe: stripe-node + Webhooks
	•	Deployment: Vercel + Postgres Provider

Wenn du einen anderen Stack wählst, begründe es kurz.

Phase 1 — Repository & Grundgerüst
	•	Projekt bootstrappen
	•	Routing / Layout / Basic UI Components
	•	Config-Management (ENV, Secrets)
	•	CI (mindestens lint + tests)

Phase 2 — UI/UX Implementierung
	•	Design: clean, modern, responsive
	•	Pages/Flows:
	•	Landing
	•	Login
	•	Dashboard (zeigt Auth-Status + Billing-Status)
	•	Pricing/Checkout
	•	Account/Settings (Logout, Billing verwalten)
	•	Zustände:
	•	loading
	•	empty
	•	error
	•	offline/timeout handling (basic)

Phase 3 — Google Auth (Browser + Google Console Setup)

Du richtest Google OAuth vollständig ein:
	•	OAuth Consent Screen konfigurieren
	•	Credentials erstellen (Client ID/Secret)
	•	Redirect URIs korrekt setzen (lokal + deployed)
	•	Testen:
	•	login
	•	logout
	•	session persists
	•	redirect nach login korrekt
	•	Fehlerfälle (user denies consent, expired session)

Wenn du dafür Zugriff auf meinen Google Account brauchst: melde dich sofort und fordere exakt das an.

Phase 4 — Stripe (zuerst Test Account komplett einrichten!)

Wichtig: Du sollst als erstes einen Stripe Test Account bei mir einrichten.
	•	Erstelle/konfiguriere Stripe Account im Testmodus
	•	Lege Produkte/Preise an (Default: Subscription monatlich + optional yearly)
	•	Checkout Session Flow implementieren
	•	Webhooks:
	•	local testing (Stripe CLI, falls möglich)
	•	deployed webhook endpoint
	•	DB Modell:
	•	user ↔ stripeCustomerId
	•	subscriptionStatus
	•	currentPeriodEnd
	•	planId/priceId
	•	Billing Portal (optional aber sehr empfohlen)
	•	Testfälle:
	•	successful payment
	•	failed payment
	•	canceled subscription
	•	renewed subscription
	•	webhook retry / idempotency

Wenn du Stripe Login-Zugriff brauchst: fordere ihn präzise an (Invite-Mail, Rolle, 2FA etc.).

Phase 5 — Edge Case & Quality Testing (Pflicht)

Du führst systematisch Tests durch und behebst alles, was du findest.

Edge Cases (Minimum-Liste, erweitere sie eigenständig):
	•	Auth:
	•	User cancels Google consent
	•	Login in privatem Fenster / third-party cookie restrictions
	•	Session expired / refresh
	•	Redirect Loop Prevention
	•	Same email re-login
	•	Stripe:
	•	Webhook kommt doppelt → idempotent
	•	Checkout abgebrochen
	•	Payment requires action / fails
	•	user logged out during checkout return
	•	price mismatch / unknown priceId
	•	UI:
	•	langsames Netz → loading states
	•	mobile layout overflow
	•	iOS Safari quirks (basic sanity)
	•	empty dashboard (no subscription)
	•	error boundary pages
	•	Security:
	•	unautorisierter Zugriff auf /dashboard
	•	webhook signature verification
	•	env leaks vermeiden

Test-Artefakte:
	•	E2E Test Suite (Playwright/Cypress)
	•	Testprotokoll als Markdown (Checkliste + Ergebnis)
	•	Bugfix-Liste mit “fixed / won’t fix” + Begründung

Phase 6 — Deployment, Domain, Produktionsschalter
	•	Deployment erstellen (staging + production wenn möglich)
	•	ENV Vars korrekt setzen
	•	Google OAuth Redirects für Prod setzen
	•	Stripe Webhooks für Prod setzen (erst Testmode verpflichtend, Live optional vorbereiten)
	•	Smoke Tests auf Prod URL

Phase 7 — Abschluss & Übergabe

Du lieferst:
	1.	Repo/Code (oder ZIP) mit sauberer Struktur
	2.	Live URL(s)
	3.	Dokumentation:
	•	Setup lokal
	•	ENV Vars
	•	“Wie ändere ich Google/Stripe”
	•	“Wie gehe ich live”
	4.	Testprotokoll + E2E Tests
	5.	Liste offener Risiken/Verbesserungen (falls vorhanden)

⸻

Kommunikationsformat (wie du berichtest)

Du arbeitest in kurzen Status-Updates, z. B.:
	•	Jetzt in Arbeit: Phase X
	•	Erledigt: Liste
	•	Gefunden/Behoben: Bugs/Edge Cases
	•	Brauche Zugriff: konkret (wenn nötig)
	•	Nächster Schritt: Phase Y

Wenn du Zugriff brauchst, formuliere es so:
	•	Benötigter Zugriff: (z. B. Google Cloud Console / Stripe Invite / GitHub Repo)
	•	Warum: (konkret)
	•	Was ich dann mache: (konkret)
	•	Wie du es mir gibst: (kurz)

⸻

Erfolgskriterien (hart)
	•	Google Auth funktioniert stabil lokal + deployed
	•	Stripe Checkout + Webhooks funktionieren stabil im Testmode
	•	UI responsive + saubere Zustände
	•	Edge Cases getestet und dokumentiert
	•	E2E Tests vorhanden und laufen
	•	Deployment produktionsreif
	•	Ich kann das Projekt ohne dich betreiben (Doku stimmt)