# CitePilot Security Audit Log

Living document for structured security reviews. Update after every audit session.

**Codebase map (for auditors):**
- Proxy / auth gate: `src/proxy.ts` (Next.js 16 — not `middleware.ts`)
- Auth: `src/lib/auth/`
- DB layer: `src/lib/db/query.ts`, `src/lib/db/postgres-schema.ts` (raw SQL, no Drizzle)
- Stripe webhook: `src/app/api/billing/webhook/route.ts`
- Cron auth: `src/lib/cron/auth.ts` + `CRON_SECRET`
- CORS allowlist: `src/lib/cors.ts` (enforced in `src/proxy.ts` for `/api/*`)

---

## Audit Classification Key

| Icon | Severity | SLA |
|------|----------|-----|
| 🔴 | **CRITICAL** | Exploitable now — immediate fix |
| 🟠 | **HIGH** | Significant risk — fix within 48 hours |
| 🟡 | **MEDIUM** | Moderate risk — fix within 2 weeks |
| 🔵 | **LOW** | Minor risk — next sprint |
| ⚪ | **OBSERVATION** | Best-practice gap — no immediate risk |

**Status values:** `Open` · `In Progress` · `Fixed` · `Accepted` · `Won't Fix`

---

## Audit 1 — [DATE: fill in when run]

**Auditor:** AI (Cursor) + [your name]  
**Scope:** Authentication & Access Control  
**Files reviewed:** `src/proxy.ts`, `src/lib/auth/`, `src/app/api/auth/`, `src/lib/admin-auth.ts`, `src/lib/security/`

### Checklist

- [ ] Session verified on all protected routes (Neon Auth)
- [ ] Dashboard routes gated via `auth.middleware` in `src/proxy.ts`
- [ ] Admin routes check `ADMIN_EMAILS` before logic (`src/lib/admin-auth.ts`)
- [ ] Fleet 2FA enforced on dashboard when enabled (`src/lib/security/fleet-2fa.ts`)
- [ ] Workspace access checks use `canAccessWorkspace` / member roles
- [ ] Invite tokens are single-use and expire
- [ ] Sign-out clears session + locale + TOTP cookies
- [ ] No auth bypass via `ALLOW_BILLING_BYPASS` in production

### Findings

| # | Severity | File | Finding | Status |
|---|----------|------|---------|--------|
| 1 | | | | Open |
| 2 | | | | Open |

### Remediation Completed

- [ ] Finding #1:
- [ ] Finding #2:

---

## Audit 2 — [DATE: fill in when run]

**Auditor:** AI (Cursor) + [your name]  
**Scope:** API Routes & Input Validation  
**Files reviewed:** `src/app/api/` (route handlers)

### Known CitePilot API Surface to Cover

Audit each area (check all route handlers under the folder):

- [ ] `src/app/api/auth/` — Neon Auth catch-all, sign-out, 2FA verify
- [ ] `src/app/api/audit/` — free audit, workspace audit, share links
- [ ] `src/app/api/workspaces/` — CRUD, members, invites, schedule, export
- [ ] `src/app/api/billing/` — checkout, portal, webhook, limits, promo
- [ ] `src/app/api/webhooks/` — Resend (and any other inbound webhooks)
- [ ] `src/app/api/health/` — public health endpoint
- [ ] `src/app/api/tools/` — free citation checker, geo-playbook subscribe
- [ ] `src/app/api/cron/` — scheduled scans, digests, email sequences, account deletion
- [ ] `src/app/api/account/` — delete, export, cancel-deletion
- [ ] `src/app/api/invite/` — team invite accept flow
- [ ] `src/app/api/admin/` — admin-only routes
- [ ] `src/app/api/v1/` — Fleet API keys + JSON API
- [ ] `src/app/api/fleet/` — API key management
- [ ] `src/app/api/security/` — 2FA setup/enable/disable
- [ ] `src/app/api/integrations/` — Slack OAuth, webhooks
- [ ] `src/app/api/content/` — CMS publish, Webflow, generate
- [ ] `src/app/api/score/` — public score pages, claim, verify
- [ ] `src/app/api/widget/` — embed badge, score widget

### Checklist per route

For each handler, verify:

- [ ] Authentication check (401 if unauthenticated where required)
- [ ] Authorization check (403 if wrong user/workspace/role)
- [ ] Zod validation on all body/query params
- [ ] Rate limiting on public or abuse-prone endpoints
- [ ] No raw DB errors returned to client
- [ ] No sensitive data logged to console
- [ ] Idempotency for webhooks and payment side-effects

### Findings

| # | Severity | Route | Finding | Status |
|---|----------|-------|---------|--------|
| 1 | | | | Open |

### Remediation Completed

- [ ] Finding #1:

---

## Audit 3 — [DATE: fill in when run]

**Auditor:** AI (Cursor) + [your name]  
**Scope:** Data Layer & PII Handling  
**Files reviewed:** `src/lib/db/postgres-schema.ts`, `src/lib/db/query.ts`, `src/lib/server/`, `src/lib/account/`

### CitePilot PII Inventory

Document what we store and how it is protected. Update when schema changes.

| Data Type | Table / location | Encrypted? | Retention Policy |
|-----------|------------------|------------|------------------|
| Email address | `user_accounts`, `user_referrals`, Neon Auth | No (plain in DB) | Until account deletion |
| Stripe customer / subscription IDs | `billing_accounts`, `user_accounts` | No (reference only) | Until deletion |
| Domain names | `workspaces`, `audit_runs` | No | Until workspace deleted/archived |
| Audit results (prompts, gaps, scores) | `audit_runs`, `platform_citation_checks` | No | Per workspace lifecycle; cron retention TBD |
| TOTP secrets | `user_totp` | Yes (`TOTP_ENCRYPTION_KEY` / `CMS_ENCRYPTION_KEY` fallback) | Until 2FA disabled |
| CMS credentials | `cms_connections.credentials_encrypted` | Yes (`CMS_ENCRYPTION_KEY`) | Until disconnect |
| Slack tokens | `slack_connections.encrypted_token` | Yes | Until revoked |
| Webhook secrets | `webhook_endpoints.encrypted_secret` | Yes | Until deleted |
| Fleet API keys | `fleet_api_keys.key_hash` | Hashed (not reversible) | Until revoked |
| Invite tokens | `workspace_members.token` | Plain (opaque UUID) | Until accepted/expired |
| Session / auth | Neon Auth cookies | Managed by Neon | Until sign-out / expiry |
| Account export blobs | `account_export_jobs.export_data` | No (JSON in DB) | Job `expires_at` |
| Cancellation tokens | `user_accounts.cancellation_token` | Plain (signed flow) | Short-lived |

### Checklist

- [ ] Parameterized queries only (no string-concat SQL)
- [ ] Workspace scoping on all tenant data reads/writes
- [ ] Account deletion cron purges PII per `src/lib/account/purge.ts`
- [ ] Export jobs expire and are not world-readable
- [ ] No over-fetching in API responses (minimal fields)

### Findings

| # | Severity | Table/File | Finding | Status |
|---|----------|------------|---------|--------|
| 1 | | | | Open |

### Remediation Completed

- [ ] Finding #1:

---

## Audit 4 — [DATE: fill in when run]

**Auditor:** AI (Cursor) + [your name]  
**Scope:** Stripe & Payment Security  
**Files reviewed:** `src/app/api/billing/webhook/route.ts`, `src/app/api/billing/`, `src/lib/stripe/`, `src/lib/billing/`

### Stripe Security Checklist

- [ ] Webhook signature verified with `constructEvent()` on every request
- [ ] `STRIPE_WEBHOOK_SECRET` set in env (never hardcoded)
- [ ] Price IDs read server-side from env (`STRIPE_PILOT_PRICE_ID`, etc.) — not from client
- [ ] Subscription tier derived server-side from Stripe objects, not client payload
- [ ] Customer ID validated against authenticated user before checkout/portal
- [ ] Webhook handlers idempotent (duplicate events safe)
- [ ] Test mode keys never committed to repo
- [ ] `ALLOW_BILLING_BYPASS` unset in production

### Findings

| # | Severity | File | Finding | Status |
|---|----------|------|---------|--------|
| 1 | | | | Open |

### Remediation Completed

- [ ] Finding #1:

---

## Audit 5 — [DATE: fill in when run]

**Auditor:** AI (Cursor) + [your name]  
**Scope:** Environment Variables & Secrets Management  
**Files reviewed:** `.env.example`, `next.config.ts`, `src/lib/**/config.ts`

### CitePilot Secrets Inventory

Verify each is set in production and never hardcoded in source:

- [ ] `DATABASE_URL` / `DATABASE_URL_POOLED` — Neon connection
- [ ] `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` — Neon Auth
- [ ] `HEALTH_SECRET` — `/api/health` detailed diagnostics
- [ ] `ADMIN_EMAILS` — admin console access
- [ ] `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — payments
- [ ] `STRIPE_PILOT_PRICE_ID`, `STRIPE_FLEET_PRICE_ID` (+ annual variants)
- [ ] `RESEND_API_KEY` — transactional email
- [ ] `POSTHOG_KEY`, `POSTHOG_HOST` — server analytics
- [ ] `SENTRY_DSN` — error monitoring (build-time inject, not `NEXT_PUBLIC_*`)
- [ ] `OPENAI_API_KEY`, `PERPLEXITY_API_KEY` — AI scanning
- [ ] `CRON_SECRET` — `/api/cron/*` auth
- [ ] `TOTP_ENCRYPTION_KEY` — 2FA secret encryption (`src/lib/security/totp-crypto.ts`)
- [ ] `CMS_ENCRYPTION_KEY` — CMS + Slack + webhook credential encryption
- [ ] `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET` — Slack OAuth
- [ ] `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — GSC OAuth

### `NEXT_PUBLIC_*` audit

These are exposed to browsers — must contain nothing sensitive:

- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe pub key (safe)
- [ ] `NEXT_PUBLIC_POSTHOG_KEY` — PostHog project key (write-only, acceptable)
- [ ] `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` — safe
- [ ] `NEXT_PUBLIC_APP_URL` — safe
- [ ] `NEXT_PUBLIC_AUDIT_MODE` — UI label only (safe)
- [ ] Review: any other `NEXT_PUBLIC_*` vars added since last audit?

### Findings

| # | Severity | Variable | Finding | Status |
|---|----------|----------|---------|--------|
| 1 | | | | Open |

### Remediation Completed

- [ ] Finding #1:

---

## Audit 6 — [DATE: fill in when run]

**Auditor:** AI (Cursor) + [your name]  
**Scope:** Third-Party Integrations  
**Files reviewed:** `src/lib/cms/`, `src/app/api/integrations/`, `src/app/api/content/`, `src/app/api/gsc/`

### Integration Security Checklist

For each integration (WordPress, Webflow, Ghost, Shopify, Framer, Slack, Google Search Console):

- [ ] OAuth / API tokens stored encrypted in DB (`CMS_ENCRYPTION_KEY`)
- [ ] Token scopes are minimal (read/write only what's needed)
- [ ] Token refresh handled gracefully (no silent failures)
- [ ] Revocation / disconnect flow exists in Dashboard → Settings
- [ ] Tokens never logged or returned in API responses
- [ ] Publish endpoints verify workspace ownership before acting

### Findings

| # | Severity | Integration | Finding | Status |
|---|----------|---------------|---------|--------|
| 1 | | | | Open |

### Remediation Completed

- [ ] Finding #1:

---

## Security Headers Audit — Verified [DATE]

Re-verify after any `next.config.ts` or `src/proxy.ts` change.

| Header | Expected | Status |
|--------|----------|--------|
| Content-Security-Policy | Set in `next.config.ts` | [ ] Verified |
| X-Frame-Options | `SAMEORIGIN` (preview route relaxed) | [ ] Verified |
| X-Content-Type-Options | `nosniff` | [ ] Verified |
| Referrer-Policy | `strict-origin-when-cross-origin` | [ ] Verified |
| Permissions-Policy | camera/mic/geo disabled | [ ] Verified |
| CORS (`/api/*`) | Allowlist via `src/lib/cors.ts` (not `*`) | [ ] Verified |
| `/api/health` | Public `ok` only; detail requires `X-Health-Secret` | [ ] Verified |

**Verify locally:**

```bash
curl -sI https://www.getcitepilot.com/ | grep -iE 'content-security|x-frame|x-content-type|referrer|permissions'
curl -s https://www.getcitepilot.com/api/health
curl -s -H "X-Health-Secret: $HEALTH_SECRET" https://www.getcitepilot.com/api/health
```

---

## Known Accepted Risks

Risks reviewed and consciously accepted:

| Risk | Reason Accepted | Review Date |
|------|-----------------|-------------|
| | | |

---

## Remediation Tracker

All open findings across audits:

| Audit | # | Severity | Finding | Owner | Due Date | Status |
|-------|---|----------|---------|-------|----------|--------|
| | | | | | | |

---

## Audit Schedule

| Audit Type | Frequency | Last Run | Next Due |
|------------|-----------|----------|----------|
| Full security audit (Audits 1–6) | Quarterly | — | — |
| API routes spot check | Monthly | — | — |
| Secrets rotation (`CRON_SECRET`, encryption keys) | Every 6 months | — | — |
| Dependency audit (`npm audit`) | Monthly | — | — |
| Security headers re-verify | After each `next.config.ts` change | — | — |
| Pre-launch / major release audit | Before every major release | — | — |

### Quick commands

```bash
# Dependency vulnerabilities
npm audit

# Grep for accidental secrets in diff
git diff --staged | rg -i 'sk_live|sk_test|password\s*=\s*["\']|api[_-]?key\s*=\s*["\']'

# Find console.log in API routes
rg 'console\.(log|debug|info)' src/app/api/
```

---

## How to Run Audits

See [`docs/audit-runner.md`](docs/audit-runner.md) for Cursor session prompts and workflow.
