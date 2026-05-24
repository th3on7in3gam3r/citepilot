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
   | `ADMIN_SECRET` | Protects `/admin` and `/api/admin/*` |
   | `STACKEXCHANGE_KEY` | Discussions (Stack Overflow) |
   | `SERPER_API_KEY` or `TAVILY_API_KEY` | Discussions + backlink discovery |
   | `OPEN_PAGERANK_API_KEY` | Optional — third-party domain authority on Backlinks |
   | `RESEND_API_KEY` | Weekly digest + audit/score-drop emails |
   | `EMAIL_FROM` | Verified sender in Resend (e.g. `CitePilot <alerts@getcitepilot.com>`) |
   | `CRON_SECRET` | Bearer token for `GET /api/cron/weekly-digest` (Vercel Cron) |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Search Console OAuth — redirect URI `{APP_URL}/api/gsc/callback` |

4. Deploy → attach custom domain **`getcitepilot.com`** (production URL; `citepilot.ai` is not used).
5. Neon Console → Auth → **Trusted domains**: include every origin users visit (`https://getcitepilot.com`, `https://www.getcitepilot.com`, `https://citepilot.vercel.app` with **no** trailing slash, `http://localhost:3000`). Must match the branch used by `NEON_AUTH_BASE_URL`.
6. Set `NEXT_PUBLIC_APP_URL=https://getcitepilot.com` on Vercel once the domain is live.
7. **Resend**: verify sending domain; add env vars above.
8. **Google Cloud**: OAuth consent + Web client; authorized redirect URI `https://getcitepilot.com/api/gsc/callback` (and Vercel preview URL for staging).
9. **Vercel Cron** (in `vercel.json`): weekly digest Mondays 14:00 UTC — set `CRON_SECRET` on Vercel.
10. Hit `GET /api/health` — confirms DB + which API keys are set (no secret values returned).

## Smoke test after deploy

See **[PRODUCTION.md](./PRODUCTION.md)** for the full checklist. Quick pass:

- [ ] `/` loads
- [ ] `/audit` runs on a real domain
- [ ] `/start` → `/dashboard` saves workspace (returning users redirect to dashboard — use **Add client workspace**)
- [ ] `/dashboard/analytics` → Google tab connects GSC when configured
- [ ] Settings → monitoring email + weekly digest toggles
- [ ] `/dashboard/discussions` returns HN + SO threads
- [ ] `/admin/login` works with `ADMIN_SECRET`
- [ ] `GET /api/health` returns `"ok": true` and `database.detail` mentions postgres

## Optional env (not blocking launch)

- Stripe live webhooks + custom domain for checkout return URLs
- Webflow CMS publish (site token)
