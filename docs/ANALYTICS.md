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

## In-product feedback (PostHog Surveys + app)

Dashboard users are identified in `PostHogIdentify` with `plan`, `daysActive`, and `is_paid` so PostHog can target surveys.

**NPS survey (configure in PostHog UI, not in code):**

1. PostHog → **Surveys** → **New survey** → **NPS**
2. Question: *How likely are you to recommend CitePilot to a colleague?*
3. Targeting: `is_paid = true`, `daysActive >= 14`, plan in `pilot` / `fleet`
4. Follow-ups: detractors (0–6) → *What could we improve?*; promoters (9–10) → *What do you love most?*
5. Display: PostHog built-in widget (SDK already loaded site-wide)

**Custom feedback (stored in DB + events):**

| Surface | Event / storage |
|---------|------------------|
| `/feedback` feature board | `feature_request_submitted`; `feature_requests` table |
| Post-audit inline | `audit_feedback_submitted`; `audit_feedback` table |
| Stripe cancel → `/cancel-survey` | `cancel_survey_submitted`; `cancel_survey_responses` + ops email |
