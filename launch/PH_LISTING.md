# Product Hunt listing copy

Internal reference for the PH submission form.

---

## Tagline (60 chars max)

```
Know if ChatGPT cites your brand — and fix the gaps
```

(59 characters)

---

## Description (260 chars max)

```
CitePilot tracks brand citations across ChatGPT, Perplexity, 
Gemini, Google AI, Grok & DeepSeek. See your citation score, 
get a weekly action plan, and prove lift — not just monitor.
```

(259 characters)

---

## Topics

- Artificial Intelligence
- SEO
- Marketing
- SaaS
- Analytics

---

## Gallery images

Upload from `public/press/` (generate with `node scripts/generate-press-assets.mjs`):

| # | File | Caption |
|---|------|---------|
| 1 | `ph-gallery-1.png` | Hook — "Is ChatGPT citing your brand?" |
| 2 | `ph-gallery-2.png` | Citation heatmap |
| 3 | `ph-gallery-3.png` | Weekly action plan |
| 4 | `ph-gallery-4.png` | Competitor SOV |
| 5 | `ph-gallery-5.png` | Proof report |

Thumbnail (240×240): `public/press/ph-thumbnail.png`

Live OG routes (fallback): `/api/og/ph-thumbnail`, `/api/og/ph-gallery/[1-5]`

---

## Maker first comment

Post within 5 minutes of going live:

```
Hey PH! [Founder name] here, maker of CitePilot 👋

This started when I noticed our team obsessing over Google rankings 
while completely ignoring the fact that buyers were asking ChatGPT 
'what's the best [category] tool?' — and we had no idea if we were 
being recommended.

Turned out we weren't. Neither were most of the brands we audited.

What CitePilot does:
✅ Scans ChatGPT, Perplexity, Gemini, Google AI, Grok, DeepSeek
✅ Shows your citation rate per money prompt (not just a vague score)
✅ Ranks weekly fixes by impact: schema, content gaps, answer capsules
✅ Re-scans after you ship fixes and shows citation delta per prompt
✅ White-label proof reports for agencies

Product Hunt exclusive: 30% off Pilot (our $79/mo plan) for the 
first 30 signups → use PRODUCTHUNT30 at checkout, or hit the 
/launch page.

I'm here all day to answer questions. What AI platforms does your 
team care most about right now — ChatGPT, Perplexity, or Google AI?
```

Replace `[Founder name]` with `NEXT_PUBLIC_FOUNDER_NAME`.

---

## Promo

- Code: `PRODUCTHUNT30`
- Offer: 30% off Pilot monthly for 3 months
- Max redemptions: 30
- Create in Stripe: `node scripts/create-ph-coupon.mjs`
- Landing: https://getcitepilot.com/launch
