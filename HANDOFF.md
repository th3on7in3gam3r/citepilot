# CitePilot — project handoff

**Status:** v1 shipped on **getcitepilot.com** · `main` deploys via Vercel · last engineering pass through retention + growth ops docs.

Use this file when returning to the project or onboarding someone else. Detailed checklists live in [PRODUCTION.md](./PRODUCTION.md) and [DEPLOY.md](./DEPLOY.md).

---

## What is built (no more v1 features required)

| Area | Notes |
|------|--------|
| **Core** | GEO audits, workspace dashboard, onboarding, plan limits (Free / Pilot / Fleet) |
| **Retention** | “Since your last scan” on Overview; weekly proof report email (Pilot+); one free explain-gap Insight on Free |
| **Autopilot** | Pilot+ weekly co-pilot: post-rescan Insights plan + email (Settings → CitePilot Autopilot); manual “Run now” |
| **Insights** | CitePilot Insights (`prioritize`, `explain-gap`) — Pilot+; rate-limited |
| **Agency** | Proof report (`/report/proof`), share links, white-label (Fleet); Pilot sets agency name + monitoring email |
| **Integrations** | Stripe billing, Resend email, Neon Auth + Postgres, optional GSC, CMS (WP/Ghost/Shopify/Framer/Webflow) |
| **Ops** | `/api/health`, Sentry, Monday crons (rescan 12:00 · digest 14:00 · ops report 15:00 UTC), `npm run smoke:production` |
| **Analytics** | Plausible + PostHog (client + server) — funnel in [docs/ANALYTICS.md](./docs/ANALYTICS.md) |

---

## Repo quick reference

```bash
npm install
npm run dev          # http://localhost:3000
npm test && npm run lint && npm run build
npm run smoke:production   # live checks vs getcitepilot.com
```

| Doc | Purpose |
|-----|---------|
| [DEPLOY.md](./DEPLOY.md) | Vercel env vars, Neon Auth domains, Resend, crons |
| [PRODUCTION.md](./PRODUCTION.md) | Full post-deploy smoke checklist |
| [docs/ANALYTICS.md](./docs/ANALYTICS.md) | PostHog funnel events |
| [.env.example](./.env.example) | All env keys (copy → `.env.local`) |

**Dependencies:** Do **not** run `npm audit fix --force` — see [PRODUCTION.md § Security & dependencies](./PRODUCTION.md#security--dependencies). Merge weekly [Dependabot](.github/dependabot.yml) PRs after `npm test` + `npm run build`.

---

## One-time validation (≈30 min on production)

Tick these once while signed in on **https://getcitepilot.com** — then treat the app as validated.

- [ ] `npm run smoke:production` → **9/9** passed
- [ ] `GET /api/health` → `ok: true`, postgres, resend, cron, stripe as expected
- [ ] Sign in (Google or email) → `/start` or dashboard works
- [ ] **Two audits** on one workspace → Overview **“Since your last scan”** shows chips
- [ ] **Free account:** one **“Explain once (free preview)”** on GEO Audit; second attempt → upgrade
- [ ] **Pilot workspace:** Settings → monitoring email + **Client reporting** agency name; **Weekly proof report email** on
- [ ] PostHog: see `audit_started`, `signup_started`, `insights_completed` after test actions
- [ ] *(When charging)* Stripe live webhook on `/api/billing/webhook` + test checkout → plan limits update
- [ ] *(Optional)* Analytics → Google: GSC connect on a real domain

Manual cron (Bearer `CRON_SECRET` from Vercel):

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  "https://getcitepilot.com/api/cron/weekly-rescan"
```

---

## Vercel env (production minimum)

Set in Vercel → Project → Environment Variables (see `.env.example` for full list).

| Variable | Why |
|----------|-----|
| `DATABASE_URL` or `NEON_URL` | Postgres |
| `NEON_AUTH_BASE_URL` + `NEON_AUTH_COOKIE_SECRET` | User auth |
| `OPENAI_API_KEY` | Live audits + content |
| `STRIPE_*` + price IDs | Billing |
| `RESEND_API_KEY` + `EMAIL_FROM` | Product email |
| `CRON_SECRET` | Protects `/api/cron/*` |
| `ADMIN_OPS_EMAIL` | Monday ops summary |
| `NEXT_PUBLIC_POSTHOG_KEY` + `POSTHOG_KEY` | Funnel (optional but recommended) |
| `SENTRY_DSN` | Error monitoring (optional) |
| `CMS_ENCRYPTION_KEY` | Before any CMS connect |

Never commit `.env.local`.

---

## Ongoing maintenance (low effort)

| When | Action |
|------|--------|
| After each deploy | `npm run smoke:production` |
| Mondays | Check **ADMIN_OPS_EMAIL** for ops report; scan Sentry if alerts configured |
| Weekly | Review / merge Dependabot PRs |
| When users report auth issues | Check Neon Auth trusted domains + `@neondatabase/auth` updates |
| When charging | Confirm Stripe webhook deliveries in dashboard |

**Do not** build new v1 features unless users or revenue justify it. Tune the Free Insight teaser only if PostHog shows weak Free → Pilot conversion ([docs/ANALYTICS.md](./docs/ANALYTICS.md)).

---

## Known non-blockers

- `npm audit` may show ~6 **transitive** advisories (Neon Auth / Next) — wait for upstream bumps.
- Perplexity / Open PageRank env keys optional.
- Preview deployments: use Stripe test keys; don’t point live webhooks at preview URLs ([DEPLOY.md § Preview / staging](./DEPLOY.md#preview--staging)).

---

## Support & brand

- Production URL: **https://getcitepilot.com**
- Support email in app config: see `src/lib/site.ts` (`supportEmail`)
- Admin (when `ADMIN_SECRET` set): `/admin` · sign in at `/admin/login`

---

*You can move to another project after the one-time validation section is checked. Engineering for CitePilot v1 is complete.*
