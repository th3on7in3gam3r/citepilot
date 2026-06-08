# Product analytics (PostHog / Plausible)

Set `NEXT_PUBLIC_POSTHOG_KEY` for the browser SDK and `POSTHOG_KEY` (same `phc_…` value) for server routes. Optionally `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` for Plausible. These `NEXT_PUBLIC_*` analytics vars are intentionally public, like Stripe publishable keys.

## Core funnel (optimize with data, not guesses)

Track conversion in PostHog **Insights → Funnels** (or Live events):

| Step | Event | Notes |
|------|--------|--------|
| 1 | `audit_started` | Public `/audit` or dashboard re-audit |
| 2 | `audit_completed` / `second_audit_completed` | After successful run |
| 3 | `signup_started` | Email or Google on `/auth/sign-up` |
| 4 | `signup_completed` | Onboarding finished |
| 5 | `pilot_checkout_started` / `fleet_checkout_started` | Pricing → Stripe |

**Decision rule:** Only change the Free **“Explain once (free preview)”** teaser if Free → Pilot conversion is weak *and* audit volume is healthy.

Server-side events (require `POSTHOG_KEY`): `insights_completed` from `/api/copilot`, audit-related captures from `/api/audit` when configured.

## Agency / retention signals

| Event | Meaning |
|--------|---------|
| `insights_completed` | CitePilot Insights used (props: `kind`, `teaser`) |
| `cms_published` | Content pushed to CMS |

Pair with **Settings → monitoring email** + **agency name** so weekly proof report emails are client-ready.
