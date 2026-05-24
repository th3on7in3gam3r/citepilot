# CitePilot — production smoke test

Run after each deploy to [citepilot.vercel.app](https://citepilot.vercel.app) or **getcitepilot.com**.

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
- [ ] Settings: monitoring email + digest toggles save

## Email (Resend)

- [ ] `RESEND_API_KEY` + verified `EMAIL_FROM` domain on Vercel
- [ ] `CRON_SECRET` set; Vercel cron hits `/api/cron/weekly-digest` (Mondays 14:00 UTC)
- [ ] Re-run audit with score drop ≥5 triggers alert when `scoreDropAlerts` is on

## Google Search Console

- [ ] Google Cloud OAuth client with redirect `https://<app>/api/gsc/callback`
- [ ] `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` on Vercel
- [ ] Connect from Analytics → Google; verify clicks/impressions after callback

## Admin ops

- [ ] `/admin` → **Dedupe duplicate workspaces** (one-time cleanup for duplicate domains per user)
- [ ] Stripe billing portal from Settings (when Stripe live)

## Not blocking smoke pass

- Custom domain DNS fully propagated
- Stripe live webhooks (Fleet checkout)
- Webflow publish (needs site token)
