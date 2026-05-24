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

**Admin console** (separate from user dashboard): `/admin` — sign in at `/admin/login` when `ADMIN_SECRET` is set. Without it, admin runs in dev mode with a warning banner.

Copy `.env.example` → `.env.local`. Key vars: `OPENAI_API_KEY`, `NEON_URL` or `DATABASE_URL`, `NEON_AUTH_BASE_URL` + `NEON_AUTH_COOKIE_SECRET`, `ADMIN_SECRET`.

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

**Auth:** [Neon Auth](https://neon.com/docs/auth/overview) at `/auth/sign-in` — users stored in your Neon project (no Supabase). **Not yet:** Stripe billing, GSC metrics, CMS publish, email digests.

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
