# Ops note — production Postgres (Phase 1)

Diagnosed **2026-07-22**.

## What is live

| Host | Role | Notes |
|------|------|--------|
| `https://getcitepilot.com` | **Apex production** | Stripe `configured: true`; `x-render-origin-server: Render` |
| `https://citepilot-flu8.onrender.com` | Same app as apex | Matches apex billing config |
| `https://citepilot.onrender.com` | Blueprint / My Workspace | Stripe **not** configured; separate env |

## Access gap

- Documented flu8 service id `srv-d9fr5pn41pts73epechg` returns **404** on the Render API for the logged-in CLI account (`jerlessm@gmail.com` → **My Workspace** + **Cadence**).
- Manageable web service: `srv-d9fmicj7uimc73f0anog` (`citepilot`).
- That service has `DATABASE_URL` (Neon, pooler-shaped) but **no** `DATABASE_URL_POOLED` / `DATABASE_URL_DIRECT` / `HEALTH_SECRET`.
- Recent logs on `citepilot`: `password authentication failed for user 'neondb_owner'`.

Until flu8 is visible in Dashboard/API again **or** apex is moved onto the Blueprint service with working Postgres + Stripe, signed-in workspace routes will keep returning 503/500 when the app DB rejects credentials.

## Required env on the service that serves getcitepilot.com

Set on **whichever** Render web service owns the custom domain (flu8 historically):

1. `DATABASE_URL_POOLED` — Supabase transaction pooler `:6543` + `?pgbouncer=true`, **or** Neon `-pooler` URL with a **current** password
2. `DATABASE_URL_DIRECT` — session / direct `:5432` for DDL
3. `DATABASE_URL` — may match pooled; app prefers `DATABASE_URL_POOLED` when set
4. `HEALTH_SECRET` — random 32+ chars so detailed health works

Verify:

```bash
curl -sS -H "X-Health-Secret: $HEALTH_SECRET" https://getcitepilot.com/api/health
# expect checks.database.ok === true, pooled/direct flags sensible
```

Signed-in smoke (browser Network tab):

- `POST /api/workspaces/check-domain` → **200**
- `POST /api/workspaces` → **200**
- `GET /api/billing/status` → **200** with `signedIn: true`

## Neon Auth vs app DB

- Auth: `NEON_AUTH_BASE_URL` (separate Auth host) — can work while app DB fails.
- App data: `DATABASE_URL*` — workspace create / check-domain / audits.

Do **not** put Neon Auth secrets into `DATABASE_URL`. Prefer Supabase for app Postgres if Neon Free compute is exhausted (see `DEPLOY.md`).

## Code hardening (shipped with this note)

- `ensurePostgres` proves `SELECT 1` first, then runs DDL best-effort so one migration failure does not block all queries when tables already exist.
- `check-domain` logs sanitized `neonDbErrorDetail` (password / quota / unreachable) without connection strings.

## Render API caution

`PUT /v1/services/{id}/env-vars` with a **partial** list **replaces the entire env set**. Always update one key at a time (`PUT .../env-vars/{KEY}`) or send the full desired map.

## Unblock path (2026-07-22)

1. Blueprint service `citepilot` (`srv-d9fmicj7uimc73f0anog`) was pointed at **Aegis Loop** Neon (`ep-delicate-lab-atd81pa3`, same project as Neon Auth). Schema ensured (`workspaces` present).
2. Apex `getcitepilot.com` / `citepilot-flu8` is **not** API-manageable from this CLI login — still needs Dashboard access **or** move the custom domain onto `citepilot` (Hobby tier is already at 2 domains on Aegis Loop: `aegis-loop.com` + `www`).
3. After flu8 is reachable: set `DATABASE_URL_POOLED` + `DATABASE_URL_DIRECT` to the Aegis Loop URIs (or Supabase), set `HEALTH_SECRET`, Manual Deploy, then run the health + wizard smoke above.
