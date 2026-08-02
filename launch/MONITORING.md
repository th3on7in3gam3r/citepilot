# Product Hunt launch — monitoring & ops checklist

Run through this **24 hours before** launch and again on launch morning.

---

## Pre-launch env

**Full step-by-step guide:** [`launch/ENV_SETUP.md`](./ENV_SETUP.md)

```bash
LAUNCH_MODE=true                    # 24–48h window — raises free audit rate limit
PH_LAUNCH_DATE=2026-06-03           # From Product Hunt scheduler (YYYY-MM-DD)
PH_PRODUCT_HUNT_URL=https://...     # Live listing URL — set at 12:01 AM PST launch day
NEXT_PUBLIC_FOUNDER_NAME=...        # Your name — /launch maker note + emails
FOUNDER_EMAIL=hello@getcitepilot.com
```

Revert `LAUNCH_MODE` **48 hours** after launch.

---

## Stripe coupon

```bash
STRIPE_SECRET_KEY=sk_... STRIPE_PILOT_PRICE_ID=price_... node scripts/create-ph-coupon.mjs
```

Verify in Stripe Dashboard:

- Coupon `PRODUCTHUNT30` — 30% off, repeating 3 months, max 30 redemptions
- Promotion code `PRODUCTHUNT30` — expires 7 days after `PH_LAUNCH_DATE`
- Applies to Pilot **monthly** price only

Test checkout: `/pricing` with promo cookie → Pilot monthly → Stripe shows discount.

---

## Press assets

With dev server running:

```bash
node scripts/generate-press-assets.mjs
# or: BASE_URL=https://getcitepilot.com node scripts/generate-press-assets.mjs
```

Upload PNGs from `public/press/` to Product Hunt.

---

## Email broadcasts (Resend)

Requires `RESEND_API_KEY`, `CRON_SECRET`, and verified sending domain.

| When | Route | Subject |
|------|-------|---------|
| T-24h | `POST /api/cron/ph-prelaunch-email` | We're launching on Product Hunt tomorrow 🚀 |
| Launch 9 AM PST | `POST /api/cron/ph-launch-day-email` | We're live on Product Hunt — thank you ❤️ |
| On signup (PH UTM) | automatic | Welcome from Product Hunt 👋 |

Trigger manually:

```bash
curl -X POST https://getcitepilot.com/api/cron/ph-prelaunch-email \
  -H "Authorization: Bearer $CRON_SECRET"

curl -X POST https://getcitepilot.com/api/cron/ph-launch-day-email \
  -H "Authorization: Bearer $CRON_SECRET"
```

Schedule in Vercel Cron or calendar — these are one-time sends, not recurring crons.

---

## Vercel / infra

- [ ] Vercel plan supports expected function concurrency (PH spikes: 1k–5k visitors in hours)
- [ ] `/launch` ISR: `revalidate = 60` + edge cache headers in `next.config.ts`
- [ ] `/api/og/*` Cache-Control headers (86400 / 604800 s-maxage)
- [ ] Neon connection pool: default 100 connections — sufficient for most PH traffic
- [ ] `LAUNCH_MODE=true` deployed before 12:01 AM PST launch

---

## Sentry alerts

- [ ] Error rate > 5 errors/minute → email immediately
- [ ] Function execution time > 10s → warning

---

## PostHog launch funnel

Create insight / dashboard:

```
ph_launch_page_visited
  → audit_started (or citation_checker_started)
  → signup_completed / ph_launch_signup_completed
  → checkout_started
  → checkout_completed
```

Check **every hour** on launch day.

Signup attribution stored in `user_onboarding.signup_source` / `signup_campaign` when `utm_source=producthunt`.

---

## Post-launch report (T+1)

Query PostHog + Stripe:

| Metric | Source |
|--------|--------|
| /launch page visits | `ph_launch_page_visited` count |
| PH signups | `ph_launch_signup_completed` or `signup_source=producthunt` |
| Free → Pilot (PH cohort) | PostHog funnel filter `utm_source=producthunt` |
| PRODUCTHUNT30 redemptions | Stripe → Coupons → PRODUCTHUNT30 |
| PH-sourced MRR | Stripe subscriptions with promo metadata |

Export to Google Sheet or PostHog insight.

---

## Launch day timeline (PST)

| Time | Action |
|------|--------|
| T-24h | Send pre-launch email |
| 12:01 AM | PH listing live — post maker comment, tweet launch post |
| 9:00 AM | Send launch-day email |
| 12:00 PM | Mid-day tweet |
| 5:00 PM | Final-hours tweet |
| T+24h | Post-launch tweet + analytics report |
| T+48h | Set `LAUNCH_MODE=false`, redeploy |
