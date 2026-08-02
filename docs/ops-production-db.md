# Ops note — production Postgres / apex cutover

Updated **2026-07-22** (apex → Blueprint cutover in progress).

## Current production topology

| Host | Role | Notes |
|------|------|--------|
| `https://citepilot.onrender.com` | **Blueprint production target** (`srv-d9fmicj7uimc73f0anog`) | Healthy Aegis Loop Neon (`DATABASE_URL_POOLED` + `DATABASE_URL_DIRECT`), Neon Auth OK, Stripe keys restored |
| `https://getcitepilot.com` / `https://citepilot-flu8.onrender.com` | **Still routed via orphaned flu8** (`srv-d9fr5pn41pts73epechg`) | Holds custom domains; CLI account can see `403` on env-vars but **cannot** list/delete the service or domains |

## Cutover progress

1. Freed Hobby custom-domain slot: removed **`www.aegis-loop.com`** from Aegis Loop (`srv-d94nm8svikkc73cod8ag`). Apex `aegis-loop.com` kept. Point `www` → `https://aegis-loop.com` at the DNS registrar if needed.
2. Removed leftover **`getcitepilot.com`** from Vercel Domains (DNS was already on GoDaddy → Render).
3. Attach to `citepilot` still returns **409** — domain exists on flu8.

## Unblock (one Dashboard action)

Sign into the Render account that still owns **flu8** (not always the same CLI login as My Workspace):

1. Open [flu8 service](https://dashboard.render.com/web/srv-d9fr5pn41pts73epechg) → **Settings → Custom Domains**
2. Delete **`getcitepilot.com`** and **`www.getcitepilot.com`**
3. Run:

```bash
chmod +x scripts/retry-attach-apex.sh
./scripts/retry-attach-apex.sh
```

4. GoDaddy DNS: keep `A @ → 216.24.57.1`; change **www** CNAME from `citepilot-flu8.onrender.com` → `citepilot.onrender.com` (or HTTP redirect to apex). Do **not** add `www` on Render until another Hobby slot is free.
5. Smoke:

```bash
curl -sS -H "X-Health-Secret: $HEALTH_SECRET" https://getcitepilot.com/api/health
# expect checks.database.ok === true, pooled=true, direct=true

# Signed-in Network tab:
# POST /api/workspaces/check-domain → 200
# POST /api/workspaces → 200
```

## Env rules

- Prefer **per-key** `PUT /env-vars/{KEY}`. A batch `PUT /env-vars` with a **partial** list **wipes** all other keys.
- App DB: Aegis Loop Neon (same project as Neon Auth host `ep-delicate-lab-atd81pa3`).
- Auth vs app DB stay split only by purpose (Auth URL vs `DATABASE_URL*`), same Neon project is OK.

## Code hardening (already on main)

- `ensurePostgres`: `SELECT 1` first, best-effort DDL, require `workspaces` table.
- `check-domain` logs sanitized `neonDbErrorDetail`.
