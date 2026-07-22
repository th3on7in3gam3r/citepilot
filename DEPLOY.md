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
   - **Build:** `npm ci && npx playwright install chromium && npm run build` (Blueprint already runs Chromium install — needed for Pilot/Fleet GEO deep crawl)
   - **Start:** `npm start` → binds `0.0.0.0:$PORT` (required on Render)
   - **Health check path:** `/api/health`
   - **Node:** 20 (`NODE_VERSION=20` or `engines.node` in `package.json`)
   - **Deep crawl:** Paid audits use Crawlee + Playwright (same-domain, Pilot 20 / Fleet 50 pages). Chromium must be present on the web service; free audits stay homepage-only `fetch`.
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
- `/api/auth/get-session` **404** `endpoint not found` — wrong/stale `NEON_AUTH_BASE_URL`, **or Auth not provisioned** on that branch (Auth host answers but every path 404s)
- `/api/auth/sign-in/social` **429** — Neon rate limit or **COMPUTE_QUOTA_EXCEEDED** on the Auth project (upgrade Neon or wait for reset). App DB on Supabase does **not** fix Neon Auth quota.

### If Auth URL returns 404 for `/` and `/get-session`

The Auth instance is dead or never finished provisioning. Trusted domains alone will not fix this.

1. Neon Console → project that owns Auth (often still a Neon Free project even if app DB moved) → **Auth**
2. If Auth is missing/disabled: **Enable / provision Auth** on the production branch
3. If the project shows **COMPUTE_QUOTA_EXCEEDED**: upgrade compute or wait for quota reset, then re-check Auth
4. Copy the fresh **Auth URL** from Auth → Configuration into Render `NEON_AUTH_BASE_URL` (must end in `/auth`)
5. Keep `NEON_AUTH_COOKIE_SECRET` unless you intentionally want to invalidate all sessions
6. Add trusted domains (below), enable Google, set Google redirect to `{NEON_AUTH_BASE_URL}/callback/google`
7. Redeploy Render, then run the verify curls

### Checklist (healthy Auth)

**Apex production (DNS):** `https://getcitepilot.com` and `https://citepilot-flu8.onrender.com` currently serve the same live app (Stripe configured). Historical service id `srv-d9fr5pn41pts73epechg` may be **missing from the Render API** for some CLI logins — if Dashboard search for `flu8` fails, see [`docs/ops-production-db.md`](docs/ops-production-db.md).

**Blueprint / manageable service:** `https://citepilot.onrender.com` — `srv-d9fmicj7uimc73f0anog` (My Workspace). `render.yaml` targets this service. It does **not** automatically sync env to the apex host. Prefer fixing `DATABASE_URL*` + `HEALTH_SECRET` on **whichever service owns the custom domain**, or move the domain onto Blueprint `citepilot` after copying secrets.

1. On **flu8** Environment: `NEON_AUTH_BASE_URL` = Auth URL from Neon Console (Aegis Loop / Auth branch, must end in `/auth`), `NEON_AUTH_COOKIE_SECRET` (32+), `NEXT_PUBLIC_APP_URL=https://getcitepilot.com` → redeploy
   - Dashboard: https://dashboard.render.com/web/srv-d9fr5pn41pts73epechg
   - `render.yaml` also pins `NEON_AUTH_BASE_URL` + `NEXT_PUBLIC_APP_URL` for Blueprint-managed services (cookie secret stays Dashboard-only)
2. Neon Auth trusted domains / origins (no trailing slash):
   - `https://getcitepilot.com`
   - `https://www.getcitepilot.com`
   - `https://citepilot-flu8.onrender.com`
   - `https://citepilot.onrender.com` (secondary probe)
3. Confirm Google provider is enabled on that Auth branch; Google Cloud redirect URI = `{NEON_AUTH_BASE_URL}/callback/google`
4. Verify:
   ```bash
   # Upstream (uses NEON_AUTH_BASE_URL from .env.local):
   npm run check:neon-auth
   # Apex (after flu8 env is correct):
   curl -s https://getcitepilot.com/api/auth/get-session
   # expect null / session JSON — not 404/429
   # Known-good probe (secondary service):
   curl -s https://citepilot.onrender.com/api/auth/get-session
   curl -H "X-Health-Secret: $HEALTH_SECRET" https://getcitepilot.com/api/health
   # checks.neonAuth.ok true
   ```
5. Incognito → `https://getcitepilot.com/auth/sign-in` → Google → `/dashboard`

## Custom domain: getcitepilot.com → Render

Production brand URL is **`https://getcitepilot.com`** (apex). On Render, **www redirects to apex**.

**Production service:** `https://citepilot-flu8.onrender.com` (`srv-d9fr5pn41pts73epechg`) — this is the post-Vercel host that serves the custom domain. Keep `NEON_AUTH_*` and `NEXT_PUBLIC_APP_URL` correct on this service.

**Secondary service:** `https://citepilot.onrender.com` (`srv-d9fmicj7uimc73f0anog`) — Auth may already be healthy here; do not confuse it with apex production.

DNS (GoDaddy after nameservers are GoDaddy’s):

| Type | Name | Data |
|------|------|------|
| A | @ | `216.24.57.1` (Render) |
| CNAME | www | `citepilot-flu8.onrender.com` |

1. **Render (flu8)** → Custom Domains → `getcitepilot.com` (+ www as redirect to apex).
2. **Render env (flu8):** `NEXT_PUBLIC_APP_URL=https://getcitepilot.com` + Neon Auth vars above
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
