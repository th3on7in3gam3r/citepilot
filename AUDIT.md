# CitePilot codebase audit

Last reviewed: May 2026

## Summary

The project is in good shape for a marketing + demo-audit MVP. This pass **removed redundancy**, **unified CTAs**, and **consolidated folders**.

---

## Removed (dead or duplicate)

| Item | Reason |
|------|--------|
| `CitationLoop` section | Duplicated the 3-step story already in `StickyProductShowcase` |
| `VideoShowcase` | Placeholder only (“demo coming soon”) — add back when you have a real video |
| `TrustBand` | Overlapped scroll marquee + platform list in audit |
| `components/landing/` folder | Merged into `components/home/` |
| `ui/Marquee.tsx` + CSS `animate-marquee` | Replaced by scroll-driven `ScrollBrandMarquee` |
| `ui/Button.tsx` | Replaced by `ProductCTA` / `ProductCTAButton` everywhere |
| `citationLoop` in `content.ts` | Only used by removed section |
| `public/*.svg` (next, vercel, etc.) | Unused create-next-app assets |

---

## Refactored

- **Single CTA system:** `ProductCTA` with `compact` mode for header; pricing uses same pills + arrow.
- **Home flow:** Hero → scroll brands → sticky product → pillars → comparison → testimonials → CTA → FAQ.
- **Copy:** Removed “Hairline shift” leftover in `ScanMock`.
- **README** + this audit doc.

---

## Keep (intentional)

| Item | Notes |
|------|--------|
| `reference/saved-page.html` | Design reference only; not served |
| Demo audit in `AuditForm` | Labeled “demo mode” — wire API when ready |
| Early testimonials | Generic beta quotes; swap for real ones when you have them |
| `scrollBrands` vs `platforms` | Brands = marquee logos; platforms = audit/FAQ list (slight overlap OK) |

---

## Still to build (product)

1. **Real audit API** — replace `buildDemoResult()` in `AuditForm.tsx`
2. **Auth + waitlist** — Pilot tier CTA currently goes to `/audit`
3. **Product video** — re-add a section when asset exists
4. **Legal pages** — Terms, Privacy (footer links when needed)
5. **Analytics** — GTM/Plausible once you ship

---

## Optional polish (low priority)

- Extract shared `Section` wrapper (padding + `Container` + `SectionHeading`)
- Move icon SVGs in `Pillars` to `components/icons/`
- Add `prefers-reduced-motion` guards on scroll marquee + float animations
- Rename repo folder `GrowthEngineAI` → `citepilot` for consistency

---

## Home page length

After cleanup the home page is **~8 sections** (was 11). If it still feels long, next cut would be **Pillars** (merge bullet copy into sticky showcase steps).
