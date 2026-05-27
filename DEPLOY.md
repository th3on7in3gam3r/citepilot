# CitePilot — deploy checklist

## Before first deploy

1. Copy `.env.example` → `.env.local` (local) and Vercel **Environment Variables** (production).
2. Never commit `.env.local`. Keys belong only in Vercel / local.
3. Set `ADMIN_SECRET` in production so `/admin` is protected.
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
   | `NEXT_PUBLIC_POSTHOG_KEY` | Optional — PostHog project API key |
   | `NEXT_PUBLIC_POSTHOG_HOST` | Optional — PostHog ingest host (default `https://us.i.posthog.com`) |
   | `SENTRY_DSN` | Optional — error monitoring (audits, webhooks, OpenAI) |

4. Deploy → attach custom domain **`getcitepilot.com`** (production URL; `citepilot.ai` is not used).
5. Neon Console → Auth → **Trusted domains**: include every origin users visit (`https://getcitepilot.com`, `https://www.getcitepilot.com`, `https://citepilot.vercel.app` with **no** trailing slash, `http://localhost:3000`). Must match the branch used by `NEON_AUTH_BASE_URL`.
6. Set `NEXT_PUBLIC_APP_URL=https://getcitepilot.com` on Vercel once the domain is live.
7. **Resend**: verify sending domain; add env vars above.
8. **Google Cloud**: OAuth consent + Web client; authorized redirect URI `https://getcitepilot.com/api/gsc/callback` (and Vercel preview URL for staging).
9. **Vercel Cron** (in `vercel.json`): `weekly-rescan` Mondays 12:00 UTC (Pilot/Fleet re-audits), `weekly-digest` Mondays 14:00 UTC — set `CRON_SECRET` on Vercel (mandatory in production).
10. **Billing**: In production, paid features require Stripe + Neon Auth — misconfigured env will **deny** Pilot/Fleet access (no silent bypass).
11. **Fleet API**: `GET /api/workspaces/[id]/export` (session or `Authorization: Bearer cp_fleet_…`), `POST /api/workspaces/[id]/prompts/import` (CSV), and `GET/POST /api/fleet/api-keys` require Fleet. Rate limit: 120 requests/hour per key or session.
12. Hit `GET /api/health` — confirms DB + which API keys are set (no secret values returned).

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

## Optional env (not blocking launch)

- Stripe live webhooks + custom domain for checkout return URLs
- Webflow CMS publish (site token)
