# Deployment (Vercel + Convex + Stripe + Google OAuth)

This document is a **handoff package** for deploying the BFSG-WebCheck MVP.

⚠️ **Do not commit secrets**. Everything below uses placeholders.

---

## 0) Project settings (Vercel)

- Import repo: `KonradBi/BFSG`
- Root directory: `web`
- Framework preset: Next.js

After first deploy, you will get a URL like:

- `https://<PROJECT>.vercel.app`

Use that URL for the OAuth/Webhook settings below.

---

## 1) Environment variables (Vercel → Project → Settings → Environment Variables)

Set these for **Production** (and optionally Preview).

### App URLs

```bash
NEXT_PUBLIC_APP_URL=https://<PROJECT>.vercel.app
NEXTAUTH_URL=https://<PROJECT>.vercel.app
```

### Auth (NextAuth)

```bash
# generate locally:
#   openssl rand -hex 32
AUTH_SECRET=<random_hex_32_bytes>

AUTH_GOOGLE_ID=<...apps.googleusercontent.com>
AUTH_GOOGLE_SECRET=<GOCSPX-...>
```

### Convex

```bash
NEXT_PUBLIC_CONVEX_URL=https://<YOUR_CONVEX_DEPLOYMENT>.convex.cloud
```

### Stripe (test first)

```bash
# Stripe API keys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...   # optional (only if used in UI)

# Price IDs
STRIPE_PRICE_MINI=price_...
STRIPE_PRICE_STANDARD=price_...
STRIPE_PRICE_PLUS=price_...

# Webhook secret (set after you create a webhook endpoint)
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 2) Google OAuth settings (Google Cloud Console)

Create / configure an OAuth client of type **Web application**.

### Authorized JavaScript origins

- `https://<PROJECT>.vercel.app`

### Authorized redirect URIs

- `https://<PROJECT>.vercel.app/api/auth/callback/google`

---

## 3) Stripe setup

### 3.1 Create products / prices

In Stripe Dashboard:
- Products → create 3 products (Mini/Standard/Plus)
- Copy each **Price ID** (`price_...`) into:
  - `STRIPE_PRICE_MINI`
  - `STRIPE_PRICE_STANDARD`
  - `STRIPE_PRICE_PLUS`

### 3.2 Webhook endpoint (Production)

Stripe Dashboard → Developers → Webhooks → **Add endpoint**:

- Endpoint URL:
  - `https://<PROJECT>.vercel.app/api/stripe/webhook`

- Events (minimum):
  - `checkout.session.completed`

Copy the generated signing secret `whsec_...` into:

- `STRIPE_WEBHOOK_SECRET`

---

## 4) Stripe CLI (local testing)

### Login

```bash
stripe login
```

### Forward webhook events to local dev server

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The command prints a webhook secret `whsec_...` which you can use locally as `STRIPE_WEBHOOK_SECRET`.

---

## 5) Quick checklist

- [ ] Vercel project imported (root = `web`)
- [ ] Vercel env vars set (URLs, AUTH_*, Convex, Stripe)
- [ ] Google OAuth redirect URI set to Vercel callback URL
- [ ] Stripe products/prices created (Price IDs set)
- [ ] Stripe webhook endpoint created (prod whsec set)
- [ ] End-to-end test:
  - [ ] `/login` works
  - [ ] `/scan` → scan → checkout → success redirect works
  - [ ] PDF opens after payment

---

## Notes

- This MVP is **report-only**: Scan → Pay → PDF report.
- Automated checks (axe) do not catch everything; manual testing is recommended.
