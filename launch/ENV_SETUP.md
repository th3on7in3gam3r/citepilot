# Product Hunt launch — environment variables setup

Step-by-step guide for the three values you asked about, plus related launch vars. Work through this **before** scheduling emails or going live.

---

## Quick checklist

| Step | Variable | When to set | Where it comes from |
|------|----------|-------------|---------------------|
| 1 | `NEXT_PUBLIC_FOUNDER_NAME` | Anytime before launch | You (your name) |
| 2 | `FOUNDER_EMAIL` | Anytime before launch | Your support inbox |
| 3 | `PH_LAUNCH_DATE` | When PH confirms your date | Product Hunt scheduler |
| 4 | `PH_PRODUCT_HUNT_URL` | **After listing goes live** (12:01 AM PST) | Product Hunt listing page |
| 5 | `LAUNCH_MODE` | 24h before launch → 48h after | You (manual toggle) |

---

## Where to put values

### Local development

Add to **`.env.local`** in the project root (this file is gitignored):

```bash
NEXT_PUBLIC_FOUNDER_NAME=Your Name
FOUNDER_EMAIL=hello@getcitepilot.com
PH_LAUNCH_DATE=2026-06-03
PH_PRODUCT_HUNT_URL=https://www.producthunt.com/products/citepilot
LAUNCH_MODE=true
```

Restart `npm run dev` after changing `.env.local`.

### Production (Vercel)

1. Open [Vercel Dashboard](https://vercel.com) → your CitePilot project
2. **Settings** → **Environment Variables**
3. Add each variable for **Production** (and Preview if you test on preview URLs)
4. **Redeploy** after saving — env changes do not apply to a running deployment until redeploy

---

## Step 1 — `NEXT_PUBLIC_FOUNDER_NAME`

### What it does

- Maker note on `/launch` (“[Founder name] here — I built CitePilot because…”)
- Sign-off in PH pre-launch, launch-day, and welcome emails
- Maker first comment template in `launch/PH_LISTING.md`

### Where to get the value

**You decide.** Use the name you want on Product Hunt and in emails — usually your first name or full name as maker.

### Example

```bash
NEXT_PUBLIC_FOUNDER_NAME=Jeremy
```

### Notes

- `NEXT_PUBLIC_` means it can appear in client-rendered UI (launch page). Do not put secrets here.
- Server-only fallback: `FOUNDER_NAME` (same value, no `NEXT_PUBLIC_` prefix). Prefer `NEXT_PUBLIC_FOUNDER_NAME` so the launch page works.
- If unset, the app falls back to **“The CitePilot team”**.

### Verify

1. Set the var and restart dev server
2. Visit `http://localhost:3000/launch`
3. Scroll to **Maker note** — your name should appear

---

## Step 2 — `FOUNDER_EMAIL` (recommended)

### What it does

- “Questions? Reach me directly: …” footer on `/launch`
- Reply-to context for welcome emails (users reply to `EMAIL_FROM` unless you change that separately)

### Where to get the value

Use the inbox you actually read — often the same as `hello@getcitepilot.com` or your personal founder email.

### Example

```bash
FOUNDER_EMAIL=hello@getcitepilot.com
```

### Verify

Check the footer CTA on `/launch` shows the correct address.

---

## Step 3 — `PH_LAUNCH_DATE`

### What it does

- Pre-launch email: “goes live at 12:01 AM PST on **[date]**”
- Stripe coupon script: `PRODUCTHUNT30` expires **7 days after** this date
- Social copy templates in `launch/SOCIAL_COPY.md`

### Where to get the value

1. Log in to [Product Hunt](https://www.producthunt.com)
2. Go to **Dashboard** → **My products** → **CitePilot** (or start a new launch submission)
3. When scheduling your launch, Product Hunt shows your **launch date**
4. Use that calendar date in **ISO format** `YYYY-MM-DD`

Product Hunt launches at **12:01 AM Pacific Time** on the date you pick.

### Example

Launch scheduled for Wednesday, June 3, 2026:

```bash
PH_LAUNCH_DATE=2026-06-03
```

Optional public copy (only if you need the date in client UI):

```bash
NEXT_PUBLIC_PH_LAUNCH_DATE=2026-06-03
```

### Notes

- Use the **date in Pacific time** as shown on Product Hunt, not UTC conversion.
- Set this **before** running `node scripts/create-ph-coupon.mjs` so coupon expiry is correct.
- Set this **before** sending the pre-launch email cron.

### Verify

Pre-launch email preview (local): trigger sequence `ph_prelaunch` via `/api/email/send` with cron auth, or inspect rendered template — date should read like “Wednesday, June 3, 2026”.

---

## Step 4 — `PH_PRODUCT_HUNT_URL`

### What it does

- “Support CitePilot on Product Hunt →” link in pre-launch and launch-day emails
- Any server-rendered PH links in email templates

### Where to get the value

**You cannot get this until the listing is live.**

#### Before launch day

- Leave unset, or use a placeholder only in drafts — emails will fall back to `https://www.producthunt.com` (not ideal for send).

#### On launch day (12:01 AM PST)

1. Open [producthunt.com](https://www.producthunt.com)
2. Find your **CitePilot** listing (Today’s launches or your product page)
3. Copy the **full URL** from the browser address bar

Common URL shapes:

```text
https://www.producthunt.com/products/citepilot
https://www.producthunt.com/posts/citepilot
```

Use whichever URL Product Hunt gives you when the listing is live — both work as long as they open your listing.

### Example

```bash
PH_PRODUCT_HUNT_URL=https://www.producthunt.com/products/citepilot
```

Optional (only if you need the link in client-side JS):

```bash
NEXT_PUBLIC_PH_PRODUCT_HUNT_URL=https://www.producthunt.com/products/citepilot
```

### Timeline

| Time (PST) | Action |
|------------|--------|
| T-24h | Send pre-launch email — PH link can say “goes live tomorrow”; full URL optional |
| 12:01 AM launch day | Listing live → **set `PH_PRODUCT_HUNT_URL`** → redeploy Vercel |
| 9:00 AM launch day | Send launch-day email — **must** have correct URL |

### Verify

1. Set var and redeploy
2. Open a pre-launch or launch-day email test
3. Click “Vote for CitePilot on Product Hunt” — should land on your listing, not the PH homepage

---

## Step 5 — `LAUNCH_MODE` (launch window)

### What it does

When `LAUNCH_MODE=true`:

- Free audit rate limit: **10 per IP per hour** (up from 8)
- Audit API response includes: `special_offer: "Use PRODUCTHUNT30 for 30% off Pilot"`

### Where to get the value

You turn it on manually — not from Product Hunt.

### Example

```bash
LAUNCH_MODE=true
```

### Timeline

- Set **`true`** ~24 hours before launch (when PH traffic starts)
- Set **`false`** or remove **48 hours after** launch
- Redeploy after each change on Vercel

---

## Complete `.env.local` example

Copy and fill in before launch week:

```bash
# --- Product Hunt launch ---

# Step 1: Your name (shows on /launch + emails)
NEXT_PUBLIC_FOUNDER_NAME=Jeremy

# Step 2: Inbox for /launch footer
FOUNDER_EMAIL=hello@getcitepilot.com

# Step 3: From Product Hunt scheduler (YYYY-MM-DD)
PH_LAUNCH_DATE=2026-06-03

# Step 4: Add AFTER listing goes live (12:01 AM PST launch day)
PH_PRODUCT_HUNT_URL=https://www.producthunt.com/products/citepilot

# Step 5: Toggle for launch traffic window
LAUNCH_MODE=true
```

---

## Complete Vercel setup (production)

1. **Settings → Environment Variables → Add**

   | Name | Value | Environments |
   |------|-------|--------------|
   | `NEXT_PUBLIC_FOUNDER_NAME` | `Jeremy` | Production, Preview |
   | `FOUNDER_EMAIL` | `hello@getcitepilot.com` | Production |
   | `PH_LAUNCH_DATE` | `2026-06-03` | Production |
   | `PH_PRODUCT_HUNT_URL` | *(add launch morning)* | Production |
   | `LAUNCH_MODE` | `true` then `false` after 48h | Production |

2. **Deployments → Redeploy** latest `main`

3. Confirm on live site: `https://getcitepilot.com/launch`

---

## Launch week timeline (env-focused)

### T-7 days

- [ ] Set `NEXT_PUBLIC_FOUNDER_NAME`
- [ ] Set `FOUNDER_EMAIL`
- [ ] Set `PH_LAUNCH_DATE` (from PH dashboard)
- [ ] Run Stripe coupon script (uses `PH_LAUNCH_DATE`):
  ```bash
  PH_LAUNCH_DATE=2026-06-03 STRIPE_SECRET_KEY=sk_... STRIPE_PILOT_PRICE_ID=price_... node scripts/create-ph-coupon.mjs
  ```

### T-1 day

- [ ] Set `LAUNCH_MODE=true` on Vercel → redeploy
- [ ] Send pre-launch email: `POST /api/cron/ph-prelaunch-email` (see `launch/MONITORING.md`)

### Launch day — 12:01 AM PST

- [ ] Copy live PH listing URL → set `PH_PRODUCT_HUNT_URL` → redeploy
- [ ] Post maker comment (`launch/PH_LISTING.md`)

### Launch day — 9:00 AM PST

- [ ] Confirm `PH_PRODUCT_HUNT_URL` is set
- [ ] Send launch-day email: `POST /api/cron/ph-launch-day-email`

### T+2 days

- [ ] Set `LAUNCH_MODE=false` → redeploy

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Maker note says “The CitePilot team” | `NEXT_PUBLIC_FOUNDER_NAME` not set or dev server not restarted | Set var, restart / redeploy |
| PH email links go to producthunt.com homepage | `PH_PRODUCT_HUNT_URL` missing | Set URL after listing is live |
| Pre-launch email says “launch day” instead of a date | `PH_LAUNCH_DATE` missing | Set `PH_LAUNCH_DATE=YYYY-MM-DD` |
| Promo / audit offer not showing | `LAUNCH_MODE` not `true` | Set on Vercel and redeploy |
| Changes not visible on production | Env updated but no redeploy | Redeploy from Vercel dashboard |

---

## Related docs

- `launch/MONITORING.md` — cron emails, PostHog funnel, Sentry alerts
- `launch/PH_LISTING.md` — tagline, gallery, maker comment
- `launch/SOCIAL_COPY.md` — Twitter / LinkedIn templates
- `.env.example` — full list of app env vars
