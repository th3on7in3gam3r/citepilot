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
- [ ] Overview **Since your last scan** card shows chips after **two+ audits** on the same workspace (e.g. `−1 prompt cited`, `+1 gap`)
- [ ] GEO Audit shows score; Fleet can **Create share link** → `/audit/share/[token]` + Save as PDF
- [ ] GEO Audit: Free account gets **one** “Explain once (free preview)” Insight; second attempt shows upgrade (Pilot+)
- [ ] Analytics → **Google** tab: connect GSC or see config hint
- [ ] Analytics → **LLMs** tab shows prompt table
- [ ] Discussions returns HN + Stack Overflow threads
- [ ] Backlinks refresh (Serper/Tavily + optional Open PageRank)
- [ ] Content → generate article (OpenAI)
- [ ] Content → CMS connections show the expected providers for the workspace
- [ ] Content → connect one CMS provider and save successfully
- [ ] Content → publish a generated article to that CMS, then publish again to confirm it updates instead of duplicating
- [ ] Settings: monitoring email + digest toggles save
- [ ] Pilot/Fleet: **Settings → Client reporting** — agency name set; monitoring email set (proof report + alerts)

## Email (Resend)

- [ ] `RESEND_API_KEY` + verified `EMAIL_FROM` domain on Vercel
- [ ] `CRON_SECRET` set on Vercel (required in production — cron routes return 503 without it)
- [ ] Vercel cron (`vercel.json`): `weekly-rescan` Mon **12:00** UTC · `weekly-digest` daily **14:00** UTC (per workspace digest day) · `weekly-ops-report` Mon **15:00** UTC
- [ ] Re-run audit with score drop ≥5 triggers alert when `scoreDropAlerts` is on
- [ ] Pilot workspace: second audit with prompt loss triggers **Competitor move alerts** when enabled
- [ ] Pilot+ with monitoring email: **Weekly proof report email** on → after Monday re-scan, inbox gets delta + `/report/proof` link + client share URL
- [ ] Digest is idempotent per workspace per week (`cron_dispatch_log` — check Vercel logs for `failed` counts)

Manual cron (Bearer `CRON_SECRET`):

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  "https://getcitepilot.com/api/cron/weekly-rescan"
```

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

## Product / growth (when you have traffic)

- [ ] PostHog funnel: `audit_started` → `signup_started` → `signup_completed` → `pilot_checkout_started` — see [docs/ANALYTICS.md](./docs/ANALYTICS.md)
- [ ] Only tune the Free Insight teaser if Free → Pilot conversion is weak (don’t guess)
- [ ] Pilot users nudged to set **monitoring email** + **agency name** (Settings) for client-ready Monday proof emails

## When you have paying users

- [ ] **Stripe live webhooks** — endpoint `https://getcitepilot.com/api/billing/webhook`, events for checkout + subscription; test Pilot/Fleet checkout → workspace limits update
- [ ] **GSC connect** on a real property (Analytics → Google) — organic + citation story on one screen
- [ ] **Sentry alerts** — project alerts to Slack/email for API/audit errors (not only Monday `ADMIN_OPS_EMAIL` ops mail)

## Observability

- [ ] `SENTRY_DSN` on Vercel — API failures surface in Sentry (server-only; no `NEXT_PUBLIC_SENTRY_DSN`)
- [ ] CitePilot Insights: Pilot user can run **Prioritize** / **Explain gap**; 21st request in an hour returns 429
- [ ] `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` and/or `NEXT_PUBLIC_POSTHOG_KEY` + `POSTHOG_KEY` — funnel events in PostHog; see [docs/ANALYTICS.md](./docs/ANALYTICS.md)
- [ ] `ADMIN_OPS_EMAIL` set — Monday ops report cron emails signups, audits, and cron failures

## Staging / preview (nice-to-have)

- [ ] Vercel **Preview** env: copy production vars except use Stripe **test** keys and a separate `CRON_SECRET` if triggering crons manually
- [ ] Test Resend + cron routes on preview URL before emailing production users
- [ ] Do **not** point production Stripe webhooks at preview deployments

## Security & dependencies

`npm audit` may report **~6 advisories** (high: `better-auth` nested under `@neondatabase/auth`; moderate: `postcss` bundled with **Next**). These are **transitive** — not fixed by bumping direct deps in this repo alone.

**Do not run `npm audit fix --force`.** It often fails with `undefined@undefined` / `ETARGET`, and the suggested “fix” for PostCSS would downgrade Next to an ancient major (breaking the app).

| Action | Safe? |
|--------|--------|
| `npm audit` | Yes — review only |
| `npm audit fix` (no `--force`) | Yes — usually leaves the 6 unchanged |
| `npm audit fix --force` | **No** |
| `package.json` `overrides` for `better-auth` | Only if [Neon Auth](https://www.npmjs.com/package/@neondatabase/auth) documents a supported version; test sign-in/OAuth after |

**When to re-check:** after upgrading `@neondatabase/auth` or `next`, run `npm audit` again and rely on upstream releases rather than force-fixing.

**Dependabot:** `.github/dependabot.yml` opens weekly npm PRs for patch/minor bumps — merge after `npm test` + `npm run build`.

## Not blocking smoke pass

- Custom domain DNS fully propagated
- Stripe live webhooks (Fleet checkout)
- CMS provider credentials connected for every live client workspace
