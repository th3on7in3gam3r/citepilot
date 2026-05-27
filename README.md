# CitePilot

**Get cited in AI answers — then prove it moved.**

Citation-first GEO: monitor money prompts, prioritize fixes, measure citation lift.

## Run locally

```bash
npm install
npm run dev
```

- Home: http://localhost:3000
- Audit: http://localhost:3000/audit
- Pricing: http://localhost:3000/pricing

## Backend (wired)

Data layer: **SQLite** locally (`.data/citepilot.db`) or **Neon Postgres** when `DATABASE_URL` is set (Vercel production).

| Route | Purpose |
|-------|---------|
| `POST /api/workspaces` | Save onboarding → workspace |
| `GET /api/workspaces/[id]` | Load workspace + latest audit |
| `POST /api/audit` | Run real GEO audit (site fetch + prompt analysis) |
| `GET /api/audit/[id]` | Fetch stored audit |
| `POST /api/waitlist` | Join Pilot waitlist |
| `GET /api/discussions?q=` | HN + Stack Overflow + web (Serper/Tavily) |
| `GET /api/health` | DB + env key checklist (no secrets exposed) |
| `GET /api/admin/stats` | Admin metrics |
| `GET /api/workspaces/[id]/export` | Fleet JSON export (session or API key) |
| `POST /api/workspaces/[id]/prompts/import` | Fleet CSV prompt import |
| `GET/POST /api/fleet/api-keys` | Fleet API key management |
| `POST /api/billing/webhook` | Stripe subscription sync |
| `GET /api/gsc/metrics` | Google Search Console (OAuth) |
| `GET/POST /api/cron/weekly-*` | Weekly digest & re-scan (CRON_SECRET) |

**Admin console** (separate from user dashboard): `/admin` — sign in at `/admin/login` when `ADMIN_SECRET` is set. Without it, admin runs in dev mode with a warning banner.

Copy `.env.example` → `.env.local`. Key vars: `OPENAI_API_KEY`, `NEON_URL` or `DATABASE_URL`, `NEON_AUTH_BASE_URL` + `NEON_AUTH_COOKIE_SECRET`, `ADMIN_SECRET`, Stripe + `CRON_SECRET` for production.

## Dashboard status

| Module | Wired to real data |
|--------|-------------------|
| Overview | Audit scores, platforms, gaps, chart |
| Settings | Full edit/save, notifications, delete workspace, re-audit |
| GEO Audit | Live site signals + gaps from audit |
| Analytics | Prompt table from audit when available |
| Content | Calendar/drafts from gaps + buyer question |
| Backlinks | Serper/Tavily discovery, Open PageRank, network placements + credits |
| Discussions | HN + Stack Overflow + Serper/Tavily web search |
| Admin (`/admin`) | Workspaces, audits, waitlist (`ADMIN_SECRET` in prod) |

**Auth:** [Neon Auth](https://neon.com/docs/auth/overview) at `/auth/sign-in`. **Billing:** Stripe Pilot/Fleet with workspace limits (Free 1 · Pilot 3 · Fleet unlimited). **Fleet:** JSON export, CSV prompt import, API keys (rate-limited), white-label share links. **Monitoring:** Weekly re-scans, citation history, optional email digests (`CRON_SECRET` + Resend). **CMS:** Webflow (env), WordPress, Ghost, Shopify, Framer (per-workspace credentials).

## Structure

```
src/
  app/                 # Routes
  components/
    home/              # Landing sections + mockups
    audit/             # Audit form
    layout/            # Header, footer
    ui/                # ProductCTA, Container, Logo, …
  hooks/               # Scroll + step observers
  lib/
    site.ts            # Brand, nav
    content.ts         # Copy, pricing, FAQ
    brands.ts          # Scroll marquee brands
reference/
  saved-page.html      # Original HTML export (reference only)
```

See [AUDIT.md](./AUDIT.md) for cleanup notes and what to build next.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm test` | Vitest unit tests |
| `npm run smoke:production` | Live checks vs getcitepilot.com |

**Dependencies:** `npm audit` may show transitive advisories (Neon Auth / Next). **Do not run `npm audit fix --force`** — see [PRODUCTION.md § Security & dependencies](./PRODUCTION.md#security--dependencies). Weekly Dependabot PRs: `.github/dependabot.yml`.

**Analytics funnel:** [docs/ANALYTICS.md](./docs/ANALYTICS.md) — PostHog events for audit → signup → Pilot.

**Handoff:** [HANDOFF.md](./HANDOFF.md) — v1 status, one-time prod validation, ongoing maintenance.
