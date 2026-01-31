# Accessibility Lawsuit Shield (DE)

AI-gestützter WCAG-Scanner für SMBs & Agenturen in Deutschland: Issues finden → verständlich erklären → Fix-Patches/Tickets liefern.

## Workspace
- `web/` Next.js App Router (UI + API routes)

## Setup / Start (local)
See the detailed setup guide in `web/README.md`.

Quickstart:
```bash
cd web
npm install
docker compose up -d
cp .env.example .env.local
npx prisma generate
npx prisma migrate dev
npm run dev
```

## Notes
- No legal advice. We map automated checks to technical standards and provide remediation guidance.

# Deploy trigger 2026-01-31T18:30:19Z
