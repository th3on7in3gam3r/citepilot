# CitePilot — deploy checklist

## Before first deploy

1. Copy `.env.example` → `.env.local` (local) and your host’s **Environment Variables** (production).
2. Never commit `.env.local`. Keys belong only in Render / Vercel / local.
3. Set `ADMIN_EMAILS` (and Neon Auth) in production so `/admin` is protected for listed emails via `src/proxy.ts`.
4. Set `DATABASE_URL` / `DATABASE_URL_POOLED` (Postgres) — without either, SQLite under `.data/` will not persist across deploys.

## Render + Supabase (current production path)

1. Create a [Supabase](https://supabase.com) project → **Settings → Database → Connection string**.
   - `DATABASE_URL_POOLED` = **Transaction** pooler (port **6543**, `?pgbouncer=true`)
   - `DATABASE_URL_DIRECT` = Session / direct (port **5432**) for DDL if needed
   - `DATABASE_URL` can be either; prefer pooled for the app
2. Push this repo to GitHub → create a **Web Service** on [Render](https://render.com) (or apply `render.yaml`).
3. Service settings:
   - **Build:** `npm ci && npm run build` (or Blueprint default)
   - **Start:** `npm start` → binds `0.0.0.0:$PORT` (required on Render)
   - **Health check path:** `/api/health`
   - **Node:** 20 (`NODE_VERSION=20` or `engines.node` in `package.json`)
4. Env vars (minimum):

   | Variable | Purpose |
   |----------|---------|
   | `DATABASE_URL` / `DATABASE_URL_POOLED` | Supabase (or Neon) Postgres — Render uses TCP `pg` |
   | `NEON_AUTH_BASE_URL` / `NEON_AUTH_COOKIE_SECRET` | Neon Auth (still separate from the app DB) |
   | `NEXT_PUBLIC_APP_URL` | Public URL — use **`https://getcitepilot.com`** (apex; www redirects here on Render) |
   | `CRON_SECRET` | Bearer for cron routes (**required** — Render sets `RENDER=true`, so production cron auth is enforced) |
   | `HEALTH_SECRET` | Full detail on `GET /api/health` |
   | `OPENAI_API_KEY` + `NEXT_PUBLIC_AUDIT_MODE=live` | Live audits |
   | Stripe / Resend / Studio Ops / CMS keys | Same as `.env.example` |

5. Neon Console → Auth → **Trusted domains / trusted origins** (no trailing slash):
   - `https://getcitepilot.com`
   - `https://www.getcitepilot.com`
   - `https://citepilot-flu8.onrender.com`
   Google OAuth redirect URI must be Neon’s `{NEON_AUTH_BASE_URL}/callback/google` (from Auth Configuration), not a hand-rolled CitePilot path.
6. Stripe webhook: `https://getcitepilot.com/api/billing/webhook`
7. GSC OAuth redirect: `https://getcitepilot.com/api/gsc/callback`
8. **Crons:** `vercel.json` crons do **not** run on Render. Use the cron services in `render.yaml`, or Dashboard cron jobs that `curl` with `Authorization: Bearer $CRON_SECRET`. Schedules are UTC (same as former Vercel crons). Set cron `APP_URL=https://getcitepilot.com`.
9. Hit `GET /api/health` — public body is `{"ok":true}`; with `X-Health-Secret` you get DB + Neon Auth upstream + key presence checks (look for `checks.database.ok`, `checks.neonAuth`, and `pooled`/`direct` flags).

Render sets `RENDER=true` and `RENDER_EXTERNAL_URL`. CitePilot treats `RENDER=true` + `NODE_ENV=production` as production (billing gates, cron secret required).

## Neon Auth on getcitepilot.com (sign-in / Google)

App DB can be Supabase; **sign-in still uses Neon Auth**. Console noise:

- `runtime.lastError` — browser extension; ignore
- `/api/auth/get-session` **404** `endpoint not found` — wrong or stale `NEON_AUTH_BASE_URL` (must end in `/auth` from Console → Auth → Configuration)
- `/api/auth/sign-in/social` **429** — Neon rate limit or **COMPUTE_QUOTA_EXCEEDED** on the Auth project (upgrade Neon or wait for reset)

Checklist:

1. Render env: `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` (32+), `NEXT_PUBLIC_APP_URL=https://getcitepilot.com` → redeploy
2. Neon Auth trusted origins: apex + www + onrender (above)
3. Confirm Google provider is enabled on that Auth branch; Google Cloud redirect URI = `{NEON_AUTH_BASE_URL}/callback/google`
4. Verify:
   ```bash
   curl -s https://getcitepilot.com/api/auth/get-session
   # not 404/429
   curl -H "X-Health-Secret: $HEALTH_SECRET" https://getcitepilot.com/api/health
   # checks.neonAuth.ok true
   ```
5. Incognito → `https://getcitepilot.com/auth/sign-in` → Google

## Custom domain: getcitepilot.com → Render

Production brand URL is **`https://getcitepilot.com`** (apex). On Render, **www redirects to apex**.

DNS (GoDaddy after nameservers are GoDaddy’s):

| Type | Name | Data |
|------|------|------|
| A | @ | `216.24.57.1` (Render) |
| CNAME | www | `citepilot-flu8.onrender.com` |

1. **Render** → Custom Domains → `getcitepilot.com` (+ www as redirect to apex).
2. **Render env:** `NEXT_PUBLIC_APP_URL=https://getcitepilot.com`
3. Cron `APP_URL=https://getcitepilot.com`
4. Neon Auth trusted domains as in the Neon Auth section above
5. Stripe / GSC callbacks on `https://getcitepilot.com/...`
6. Confirm hero loads and:
   ```bash
   curl -H "X-Health-Secret: $HEALTH_SECRET" https://getcitepilot.com/api/health
   ```
   → `checks.database.ok: true` (Supabase via `DATABASE_URL_POOLED` + `DATABASE_URL_DIRECT`).

## Vercel + Neon (legacy)

Vercel still works if you keep `vercel.json` crons. Prefer Render for the current host. Minimum Vercel env table is unchanged from prior deploys: `DATABASE_URL`, Neon Auth, Stripe, Resend, `CRON_SECRET`, etc. Preview URLs must be listed in Neon Auth trusted domains.

## CMS publishing setup

1. Set `CMS_ENCRYPTION_KEY` before connecting any workspace CMS.
2. Redeploy after adding the env var.
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
- [ ] Header shows **Sign in** → `/auth/sign-in` → `/dashboard`
- [ ] `/start` → `/dashboard` saves workspace
- [ ] `/dashboard/content` connects at least one CMS provider
- [ ] `GET /api/health` returns `"ok": true`

## Optional env (not blocking launch)

- Stripe live webhooks + custom domain for checkout return URLs
- Webflow CMS publish (site token)
- Studio Ops webhook (`STUDIO_OPS_URL` + `STUDIO_OPS_WEBHOOK_SECRET`)
