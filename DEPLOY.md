# CitePilot — deploy checklist

## Before first deploy

1. Copy `.env.example` → `.env.local` (local) and Vercel **Environment Variables** (production).
2. Never commit `.env.local`. Keys belong only in Vercel / local.
3. Set `ADMIN_SECRET` in production so `/admin` is protected. Enforced in `src/proxy.ts` via `checkAdminAccess()` (`src/lib/admin-auth.ts`): httpOnly cookie `citepilot_admin` must match the env value on `/admin/*` (except `/admin/login`) and `/api/admin/*` (except login/logout). Without `ADMIN_SECRET`, admin runs in dev mode (open).
4. Set `DATABASE_URL` or `NEON_URL` (Neon Postgres) on Vercel — without either, SQLite under `.data/` will not persist across deploys.

## Vercel + Neon (recommended)

1. Create a [Neon](https://neon.tech) project → copy `DATABASE_URL` (pooled connection string).
2. Push repo to GitHub → Import in Vercel.
3. Env vars (minimum):

   | Variable | Purpose |
   |----------|---------|
   | `DATABASE_URL` or `NEON_URL` | Postgres (auto-creates tables on first request) |
   | `OPENAI_API_KEY` | Live audits + article generation |
   | `OPENAI_MODEL` | e.g. `gpt-4o-mini` |
   | `NEXT_PUBLIC_AUDIT_MODE` | `live` when OpenAI is set |
   | `NEON_AUTH_BASE_URL` | From Neon Console → Auth → Configuration |
   | `NEON_AUTH_COOKIE_SECRET` | `openssl rand -base64 32` (32+ characters) |
   | `CMS_ENCRYPTION_KEY` | Encrypts saved workspace CMS credentials (set an explicit stable secret in production) |
   | `ADMIN_SECRET` | Protects `/admin` and `/api/admin/*` |
   | `STACKEXCHANGE_KEY` | Discussions (Stack Overflow) |
   | `SERPER_API_KEY` or `TAVILY_API_KEY` | Discussions + backlink discovery |
   | `OPEN_PAGERANK_API_KEY` | Optional — third-party domain authority on Backlinks |
   | `RESEND_API_KEY` | Weekly digest + audit/score-drop emails |
   | `EMAIL_FROM` | Verified sender in Resend (e.g. `CitePilot <alerts@getcitepilot.com>`) |
   | `CRON_SECRET` | **Required in production.** Bearer token for Vercel Cron (`weekly-digest`, `weekly-rescan`). Generate with `openssl rand -base64 32`. |
   | `PERPLEXITY_API_KEY` | Optional live Perplexity citation checks during audits |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Search Console OAuth — redirect URI `{APP_URL}/api/gsc/callback` |
   | `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Optional — Plausible domain for funnel events |
   | `NEXT_PUBLIC_POSTHOG_KEY` | Optional — browser PostHog SDK (intentionally public `phc_…` key) |
   | `POSTHOG_KEY` | Optional — server-side capture on API routes (same `phc_…` key; server-only) |
   | `NEXT_PUBLIC_POSTHOG_HOST` | Optional — browser PostHog ingest host (default `https://us.i.posthog.com`) |
   | `POSTHOG_HOST` | Optional — server PostHog ingest host (defaults to `https://us.i.posthog.com`) |
   | `ADMIN_OPS_EMAIL` | Optional — receives weekly ops report (`/api/cron/weekly-ops-report`) |
   | `SENTRY_DSN` | Optional — error monitoring (server-only env; Sentry injects for client at build) |

4. Deploy → attach custom domain **`getcitepilot.com`** (production URL; `citepilot.ai` is not used).
5. Neon Console → Auth → **Trusted domains**: include every origin users visit (`https://getcitepilot.com`, `https://www.getcitepilot.com`, `https://citepilot.vercel.app` with **no** trailing slash, `http://localhost:3000`). Must match the branch used by `NEON_AUTH_BASE_URL`.
6. Set `NEXT_PUBLIC_APP_URL=https://getcitepilot.com` on Vercel once the domain is live.
7. **Resend**: verify sending domain; add env vars above.
8. **Google Cloud**: OAuth consent + Web client; authorized redirect URI `https://getcitepilot.com/api/gsc/callback` (and Vercel preview URL for staging).
9. **Vercel Cron** (in `vercel.json`): `weekly-rescan` Mon 12:00 UTC · `weekly-digest` Mon 14:00 UTC · `weekly-ops-report` Mon 15:00 UTC — set `CRON_SECRET` on Vercel (mandatory in production).
10. **Billing**: In production, paid features require Stripe + Neon Auth — misconfigured env will **deny** Pilot/Fleet access (no silent bypass).
11. **API rate limits** (hourly, UTC window; `429` + `X-RateLimit-*` headers):
    - `POST /api/audit` — 8/hour per IP (public) or 30/hour per signed-in user
    - `GET|POST /api/workspaces` — 120/hour per user
    - `POST /api/copilot` — 20/hour per user (Pilot+)
    - Manual Autopilot — 5/hour per user
    - Fleet export/import/API keys — 120/hour per API key or session
    - `POST /api/waitlist` — 10/hour per IP
    - `POST /api/billing/webhook` — no app rate limit (Stripe signature verification only)
12. **CORS** — Browser API calls are same-origin (`/api/*` from getcitepilot.com). Cross-origin browser requests are allowed only from trusted origins (`getcitepilot.com`, `www`, Vercel preview, localhost); server webhooks (Stripe, cron) omit `Origin` and are unaffected.
13. Hit `GET /api/health` — confirms DB + which API keys are set (no secret values returned).

## CMS publishing setup

1. Set `CMS_ENCRYPTION_KEY` on Vercel before connecting any workspace CMS.
2. Redeploy after adding the env var so new serverless functions use the key.
3. In production, open **Dashboard → Content** and connect one provider per workspace:
   - `WordPress`: site URL, username, Application Password
   - `Ghost`: site URL, Admin API key (`id:secret`)
   - `Shopify`: shop domain, Admin access token with blog/article write access
   - `Framer`: project URL, API key, collection ID, and target field IDs
4. Publish one generated article, then publish it again to verify the second push updates the same remote item.
5. Webflow remains env-based and still uses `WEBFLOW_*` variables.

## Smoke test after deploy

See **[PRODUCTION.md](./PRODUCTION.md)** for the full checklist. Quick pass:

- [ ] `/` loads
- [ ] `/audit` runs on a real domain
- [ ] `/start` → `/dashboard` saves workspace (returning users redirect to dashboard — use **Add client workspace**)
- [ ] `/dashboard/analytics` → Google tab connects GSC when configured
- [ ] Settings → monitoring email + weekly digest toggles
- [ ] `/dashboard/discussions` returns HN + SO threads
- [ ] `/dashboard/content` connects at least one CMS provider and publishes a test article
- [ ] `/admin/login` works with `ADMIN_SECRET`
- [ ] `GET /api/health` returns `"ok": true` and `database.detail` mentions postgres

## Preview / staging

Use a Vercel **Preview** deployment to test auth, crons, and Resend without touching production users:

1. Copy production env vars to Preview, except use Stripe **test** keys (`sk_test_…`, test price IDs).
2. Use a dedicated `CRON_SECRET` on Preview if you manually hit cron URLs there.
3. Point Resend at a test inbox or your own email first.
4. Register the preview URL in Neon Auth **Trusted domains** if testing sign-in on preview.
5. Keep Stripe **live** webhooks on production URL only.

Funnel and retention testing: [docs/ANALYTICS.md](./docs/ANALYTICS.md). Dependency PRs: Dependabot (`.github/dependabot.yml`).

## Optional env (not blocking launch)

- Stripe live webhooks + custom domain for checkout return URLs
- Webflow CMS publish (site token)
