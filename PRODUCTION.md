# CitePilot — production smoke test

Run after each deploy to [citepilot.vercel.app](https://citepilot.vercel.app) or **getcitepilot.com**.

## Automated checks (no login)

```bash
npm run smoke:production
# or: node scripts/smoke-production.mjs https://getcitepilot.com
```

Covers `/api/health`, marketing pages, cron auth gates, and copilot auth. Manual steps below still required for Stripe, CMS, GSC, and email.

## Health & auth

- [ ] `GET /api/health` → `"ok": true`, `database.detail` mentions postgres
- [ ] `checks.resend` / `checks.googleSearchConsole` reflect env (optional features)
- [ ] Sign in at `/auth/sign-in` (Google or email)
- [ ] `/admin/login` works when `ADMIN_SECRET` is set

## Core product

- [ ] `/` marketing page loads
- [ ] `/audit` runs on a real domain (live mode when OpenAI is set)
- [ ] New user: `/start` → completes onboarding → lands on `/dashboard?welcome=1`
- [ ] Returning user with workspaces: `/start` redirects to `/dashboard` (use **+ Add client workspace** in sidebar)
- [ ] `/start?full=1` still opens full onboarding for profile reset
- [ ] Workspace switcher lists clients; create second client within plan limits

## Dashboard modules

- [ ] Overview + getting-started checklist progress
- [ ] GEO Audit shows score; Fleet can **Create share link** → `/audit/share/[token]` + Save as PDF
- [ ] Analytics → **Google** tab: connect GSC or see config hint
- [ ] Analytics → **LLMs** tab shows prompt table
- [ ] Discussions returns HN + Stack Overflow threads
- [ ] Backlinks refresh (Serper/Tavily + optional Open PageRank)
- [ ] Content → generate article (OpenAI)
- [ ] Content → CMS connections show the expected providers for the workspace
- [ ] Content → connect one CMS provider and save successfully
- [ ] Content → publish a generated article to that CMS, then publish again to confirm it updates instead of duplicating
- [ ] Settings: monitoring email + digest toggles save

## Email (Resend)

- [ ] `RESEND_API_KEY` + verified `EMAIL_FROM` domain on Vercel
- [ ] `CRON_SECRET` set on Vercel (required in production — cron routes return 503 without it)
- [ ] Vercel cron: `weekly-rescan` Mondays 12:00 UTC, `weekly-digest` Mondays 14:00 UTC
- [ ] Re-run audit with score drop ≥5 triggers alert when `scoreDropAlerts` is on
- [ ] Pilot workspace: second audit with prompt loss triggers **Competitor move alerts** when enabled
- [ ] Digest is idempotent per workspace per week (`cron_dispatch_log` — check Vercel logs for `failed` counts)

## Google Search Console

- [ ] Google Cloud OAuth client with redirect `https://<app>/api/gsc/callback`
- [ ] `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` on Vercel
- [ ] Connect from Analytics → Google; verify clicks/impressions after callback

## CMS publishing

- [ ] `CMS_ENCRYPTION_KEY` is set on Vercel before any workspace CMS connection is saved
- [ ] WordPress / Ghost / Shopify / Framer credentials save from Dashboard → Content without server error
- [ ] Published article shows a live CMS badge/link in the article queue
- [ ] Re-publish updates the same remote CMS item instead of creating duplicates
- [ ] Webflow still publishes with `WEBFLOW_*` env vars if enabled

## Admin ops

- [ ] `/admin` → **Dedupe duplicate workspaces** (one-time cleanup for duplicate domains per user)
- [ ] Stripe billing portal from Settings (when Stripe live)

## Observability

- [ ] `SENTRY_DSN` (or `NEXT_PUBLIC_SENTRY_DSN`) on Vercel — API failures surface in Sentry
- [ ] CitePilot Insights: Pilot user can run **Prioritize** / **Explain gap**; 21st request in an hour returns 429

## Not blocking smoke pass

- Custom domain DNS fully propagated
- Stripe live webhooks (Fleet checkout)
- CMS provider credentials connected for every live client workspace
