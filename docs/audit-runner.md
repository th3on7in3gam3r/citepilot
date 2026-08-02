# How to Run CitePilot Security Audits in Cursor

Internal playbook for periodic security reviews. Findings go into [`SECURITY_AUDIT.md`](../SECURITY_AUDIT.md).

---

## Setup

Start a **new Cursor Chat** (or Agent) session. Paste this system context first:

```
You are a senior security auditor reviewing the CitePilot codebase (Next.js 16,
Neon Auth, Stripe, raw SQL via src/lib/db/query.ts). Classify every finding as
Critical, High, Medium, Low, or Observation using these icons:
🔴 CRITICAL / 🟠 HIGH / 🟡 MEDIUM / 🔵 LOW / ⚪ OBSERVATION

For each finding include:
- File and line number
- What the vulnerability is
- What an attacker could do
- The exact fix (code-level)

Be thorough. Do not skip minor issues. CitePilot uses src/proxy.ts (not
middleware.ts) for auth gating.
```

Enable **Security Audit Mode** from `.cursorrules` by saying: `security review` or `audit this file`.

---

## Session 1 — Auth & Access Control

**Maps to:** Audit 1 in `SECURITY_AUDIT.md`

**Prompt:**

```
Audit these files for authentication vulnerabilities, session management flaws,
privilege escalation, and access control gaps. Check Neon Auth integration,
admin gating, workspace membership, Fleet 2FA, and invite flows.
```

**Add to context (@ files):**

- `src/proxy.ts`
- `src/lib/auth/` (all files)
- `src/lib/admin-auth.ts`
- `src/lib/security/fleet-2fa.ts`
- `src/lib/auth/workspace-access.ts`
- `src/app/api/auth/`
- `src/app/api/invite/`

**Focus questions:**

- Can a user access another workspace by ID tampering?
- Are admin routes reachable without `ADMIN_EMAILS`?
- Is 2FA bypass possible on dashboard routes?

---

## Session 2 — API Routes

**Maps to:** Audit 2 in `SECURITY_AUDIT.md`

Work **one subfolder at a time** — the API surface is large (~150 routes).

**Prompt:**

```
Audit these API route handlers for: missing auth checks, missing Zod validation,
rate limiting gaps, injection risk, IDOR, and sensitive data exposure in
responses. List every route file reviewed.
```

**Suggested order:**

1. `src/app/api/audit/`
2. `src/app/api/workspaces/`
3. `src/app/api/billing/`
4. `src/app/api/account/`
5. `src/app/api/admin/`
6. `src/app/api/cron/`
7. `src/app/api/tools/`
8. `src/app/api/v1/` + `src/app/api/fleet/`
9. `src/app/api/integrations/` + `src/app/api/webhooks/`
10. Remaining public routes (`score/`, `widget/`, `health/`, `waitlist/`)

**Per-route checklist:** see Audit 2 in `SECURITY_AUDIT.md`.

---

## Session 3 — Data Layer & PII

**Maps to:** Audit 3 in `SECURITY_AUDIT.md`

**Prompt:**

```
Audit for SQL injection risk, unencrypted PII, over-fetching in API responses,
missing workspace scoping, and account deletion completeness.
```

**Add to context:**

- `src/lib/db/postgres-schema.ts`
- `src/lib/db/query.ts`
- `src/lib/account/purge.ts`
- `src/lib/server/workspace.ts`
- `src/app/api/account/`

Update the **PII Inventory** table in `SECURITY_AUDIT.md` if schema changed.

---

## Session 4 — Stripe & Payments

**Maps to:** Audit 4 in `SECURITY_AUDIT.md`

**Prompt:**

```
Audit this Stripe integration for webhook signature bypass, client-side price
manipulation, subscription tier spoofing, and insecure customer ID handling.
```

**Add to context:**

- `src/app/api/billing/webhook/route.ts`
- `src/app/api/billing/checkout/route.ts`
- `src/app/api/billing/portal/route.ts`
- `src/lib/stripe/`
- `src/lib/billing/`

---

## Session 5 — Env & Secrets

**Maps to:** Audit 5 in `SECURITY_AUDIT.md`

**Prompt:**

```
Audit for hardcoded secrets, insecure NEXT_PUBLIC_ exposure, and env vars that
should be required in production but are optional in code.
```

**Add to context:**

- `.env.example`
- `next.config.ts`
- `src/lib/stripe/config.ts`
- `src/lib/cms/crypto.ts`
- `src/lib/security/totp-crypto.ts`

**Also run:**

```bash
rg -n 'sk_live|sk_test|whsec_|re_[A-Za-z0-9]' --glob '!node_modules' .
rg 'NEXT_PUBLIC_' .env.example src/
```

---

## Session 6 — Third-Party Integrations

**Maps to:** Audit 6 in `SECURITY_AUDIT.md`

**Prompt:**

```
Audit CMS and OAuth integrations for credential storage, scope minimization,
token leakage in responses, and disconnect flows.
```

**Add to context:**

- `src/lib/cms/` (all providers)
- `src/app/api/content/`
- `src/app/api/integrations/`
- `src/app/api/gsc/`

---

## Session 7 — Security Headers (quick)

**Maps to:** Security Headers section in `SECURITY_AUDIT.md`

**Prompt:**

```
Re-verify security headers in next.config.ts and CORS handling in src/proxy.ts
and src/lib/cors.ts. Confirm /api/health behavior.
```

**Add to context:**

- `next.config.ts`
- `src/proxy.ts`
- `src/lib/cors.ts`
- `src/app/api/health/route.ts`

---

## After Each Session

1. Copy findings into `SECURITY_AUDIT.md` under the matching audit section.
2. Fill in the **Findings** table (severity, file, description, status).
3. Create GitHub issues for 🔴 CRITICAL and 🟠 HIGH findings.
4. Mark remediated items in **Remediation Completed** checkboxes.
5. Update the **Remediation Tracker** master table.
6. Set **Last Run** / **Next Due** in the **Audit Schedule** table.
7. Commit `SECURITY_AUDIT.md` updates (no secrets in the doc).

---

## Quarterly Full Audit

Run Sessions 1–7 in order over 1–2 days. End with:

```bash
npm audit
npm run build
npm run test
```

Document summary at the top of the latest audit section:

- Total findings by severity
- Critical/High items still open
- Accepted risks added or renewed

---

## Pre-Release Checklist (5 minutes)

Before Product Hunt launches or major releases:

- [ ] `npm audit` — no critical/high unmitigated
- [ ] `ALLOW_BILLING_BYPASS` unset in Vercel production
- [ ] `CRON_SECRET`, `STRIPE_WEBHOOK_SECRET`, `HEALTH_SECRET` set
- [ ] Spot-check `src/app/api/billing/webhook/route.ts` unchanged
- [ ] Re-run Session 7 (headers + health)
- [ ] Update **Pre-launch** row in Audit Schedule
