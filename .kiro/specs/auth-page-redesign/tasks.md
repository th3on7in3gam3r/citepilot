# Implementation Plan: Auth Page Redesign

## Overview

Restyle the CitePilot sign-in and sign-up auth pages from a single-column centered card into a full-viewport two-panel split layout. The left panel carries brand content (desktop only); the right panel is a dark hero surface with a glow orb containing the auth form. All server actions and auth business logic remain untouched. Implementation order: `GoogleSignInButton` (lowest coupling) → `AuthLayout` → `SignInForm` → `SignUpForm` + `sign-up/page.tsx`.

## Tasks

- [x] 1. Add `variant` prop to `GoogleSignInButton`
  - Open `src/components/auth/GoogleSignInButton.tsx`
  - Add `variant?: "light" | "dark"` to the props interface (default `"light"`)
  - Derive a `buttonClass` string: when `variant === "dark"` use `bg-[rgba(255,255,255,0.08)] border-[rgba(255,255,255,0.15)] text-white hover:bg-[rgba(255,255,255,0.14)]`; otherwise keep the existing `border-border bg-white text-ink hover:bg-surface` classes
  - Pass `buttonClass` to the `<button>` element's `className`, replacing the hardcoded class string
  - Update the internal error paragraph: when `variant === "dark"` use `text-red-400`, otherwise `text-red-600`
  - Do NOT change `handleGoogleSignIn`, `authClient.signIn.social` call, `trackEvent` call, or any other logic
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.5_

  - [ ]* 1.1 Write unit test: light variant (default) renders white background classes
    - Assert rendered button contains `bg-white` when no `variant` prop is passed
    - Assert rendered button contains `bg-white` when `variant="light"` is passed explicitly
    - _Requirements: 5.4_

  - [ ]* 1.2 Write unit test: dark variant renders translucent dark classes
    - Assert rendered button contains `rgba(255,255,255,0.08)` bg class when `variant="dark"`
    - Assert rendered button does NOT contain `bg-white` when `variant="dark"`
    - _Requirements: 5.2_

- [x] 2. Rewrite `src/app/auth/layout.tsx` — two-panel shell
  - Replace the current single-column flex layout with a `grid grid-cols-1 lg:grid-cols-2 min-h-[100dvh]` root element
  - **Left panel** (`hidden lg:flex flex-col justify-between p-12 bg-cream`):
    - Top: `<Logo />` (dark wordmark, `light={false}`)
    - Middle: `<h2>` with `font-display text-4xl font-bold text-ink` reading `"Cite smarter, not harder"` followed by three value-prop bullets (each: icon SVG with `aria-hidden="true"` + label text)
    - Bullet content: `"AI-powered citation tracking"`, `"Instant brand visibility scores"`, `"Share-ready audit reports"`
    - Bottom: `<Link href="/">` back link `"← Back to CitePilot"` with `text-sm font-medium text-muted hover:text-ink`
  - **Right panel** (`relative overflow-hidden hero-premium flex flex-col items-center justify-center`):
    - Glow orb: `<div aria-hidden="true" className="hero-premium-orb hero-premium-orb--cyan" />`
    - Mobile-only logo: `<div className="lg:hidden mb-8"><Logo light={true} /></div>`
    - Children wrapper: `<div className="relative z-10 w-full max-w-md px-4">{children}</div>`
  - Remove all old layout markup (the `mb-8 Logo`, `max-w-md` wrapper, standalone back link)
  - Keep file as a Server Component (no `"use client"`)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 8.1, 8.2, 8.3, 8.4, 8.5, 9.2, 9.3, 9.4_

  - [ ]* 2.1 Write unit test: layout renders two panels on desktop
    - Assert root element has `lg:grid-cols-2` class
    - Assert left panel element exists with `hidden lg:flex` (or `hidden` + `lg:flex`) classes
    - Assert right panel has `hero-premium` class
    - _Requirements: 1.1, 1.4, 1.5_

  - [ ]* 2.2 Write unit test: mobile layout hides left panel
    - Assert left panel has `hidden` as a CSS class so it is excluded from accessible DOM on mobile
    - Assert mobile logo element has `lg:hidden` class
    - _Requirements: 1.2, 1.3, 8.5_

  - [ ]* 2.3 Write unit test: glow orb has aria-hidden
    - Assert the orb div has `aria-hidden="true"`
    - Assert it carries both `hero-premium-orb` and `hero-premium-orb--cyan` classes
    - _Requirements: 3.2, 9.2_

  - [ ]* 2.4 Write unit test: left panel content
    - Assert `h2` text equals `"Cite smarter, not harder"`
    - Assert exactly 3 bullet labels are rendered
    - Assert each bullet icon has `aria-hidden="true"`
    - Assert back link `href` equals `"/"`
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 9.3, 9.4_

- [~] 3. Checkpoint — layout renders without errors
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Restyle `src/app/auth/sign-in/SignInForm.tsx`
  - Replace the outer `rounded-2xl border border-border bg-white p-8 shadow-sm` div with `glass rounded-2xl p-8` (the `.glass` class from `globals.css` provides the dark translucent surface)
  - Change the `<p>` label text color from `text-accent` to `text-accent` (unchanged — accent is fine on dark), and subtitle `text-muted` to `text-white/60`
  - Change the `<h1>` text from `text-ink` to `text-white`
  - Change all `<label>` text from `text-ink` to `text-white/70`
  - Replace the two input `className` strings — remove `border-border bg-white text-ink` and replace with the Dark_Input class string:
    ```
    mt-2 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white
    placeholder:text-white/50 outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20
    ```
  - Change submit button from `bg-ink` to `bg-[#10b981]` (keep `text-white`, `disabled:opacity-60`, `rounded-full`)
  - Pass `variant="dark"` to `<GoogleSignInButton>`
  - Update the "or email" divider spans from `bg-border` to `bg-white/[0.12]`
  - Update divider label from `text-muted` to `text-white/50`
  - Update footer "No account?" text wrapper to `text-white/60`; keep `text-accent` on the link
  - Update the OAuth error banner from `border-red-200 bg-red-50 text-red-800` to `border-red-500/40 bg-red-900/30 text-red-300`
  - Preserve `useActionState(signInWithEmail, null)`, hidden `from` field, `oauthError` logic, all `autoComplete` values — do NOT change anything in the form's action wiring
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.5, 6.1, 6.2, 6.3, 6.4, 6.6, 7.3, 7.6, 7.7, 9.1, 9.6_

  - [ ]* 4.1 Write unit test: dark card and heading
    - Assert root element has `glass` class
    - Assert `h1` reads `"Sign in"` and has `text-white` class
    - Assert `h1` is the first heading tag in the rendered output
    - _Requirements: 4.1, 4.2, 9.1_

  - [ ]* 4.2 Write unit test: dark input classes
    - Assert email input does NOT have `bg-white` class
    - Assert email input has `bg-white/[0.06]` or equivalent dark surface class
    - Assert email input has `autoComplete="email"`
    - Assert password input has `autoComplete="current-password"`
    - _Requirements: 4.4, 4.5, 9.6_

  - [ ]* 4.3 Write unit test: mint submit button
    - Assert submit button has `bg-[#10b981]` class
    - Assert submit button does NOT have `bg-ink` class
    - Assert submit button has `disabled:opacity-60`
    - _Requirements: 4.6, 4.7_

  - [ ]* 4.4 Write unit test: variant="dark" passed to GoogleSignInButton
    - Assert `<GoogleSignInButton>` receives `variant="dark"` prop
    - _Requirements: 5.5_

  - [ ]* 4.5 Write unit test: auth action wiring preserved
    - Assert form has an `action` prop (i.e., `formAction` from `useActionState` is wired)
    - Assert hidden input `name="from"` is present
    - _Requirements: 7.3, 7.6_

- [~] 5. Checkpoint — sign-in tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Restyle `src/components/auth/SignUpForm.tsx` and `src/app/auth/sign-up/page.tsx`

  - [x] 6.1 Update `sign-up/page.tsx`
    - Remove the outer `rounded-2xl border border-border bg-white p-8 shadow-sm` card div
    - Remove the inline `<p>`, `<h1>`, and subtitle `<p>` elements — these move into `SignUpForm`
    - Render only: `<Suspense fallback={null}><SignUpForm /></Suspense>`
    - _Requirements: 4.1, 4.2_

  - [x] 6.2 Update `src/components/auth/SignUpForm.tsx`
    - Add a `glass rounded-2xl p-8` wrapper `<div>` around the entire return body
    - Add the heading block at the top (inside the glass wrapper, before `<GoogleSignInButton>`):
      ```tsx
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">CitePilot account</p>
      <h1 className="font-display mt-2 text-2xl font-bold text-white">Create account</h1>
      <p className="mt-2 text-sm text-white/60">Your profile is stored in your Neon database via Neon Auth.</p>
      ```
    - Pass `variant="dark"` to `<GoogleSignInButton>`
    - Replace divider span class `bg-border` with `bg-white/[0.12]`; divider label `text-muted` with `text-white/50`
    - Replace all three input `className` strings with the Dark_Input class string (same as SignInForm, step 4)
    - Change all `<label>` text from `text-ink` to `text-white/70`
    - Change submit button from `bg-ink` to `bg-[#10b981]`
    - Update footer `text-muted` to `text-white/60`; keep `text-accent` on the link
    - Preserve `useActionState(signUpWithEmail, null)`, `handleEmailSubmit` / `trackEvent` call, all `autoComplete` values — do NOT change action wiring
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.5, 6.1, 6.2, 6.3, 6.5, 6.6, 7.4, 9.1, 9.6_

  - [ ]* 6.3 Write unit test: sign-up dark card and heading
    - Assert `SignUpForm` root has `glass` class
    - Assert `h1` reads `"Create account"` and has `text-white`
    - Assert `h1` is the first heading in rendered output
    - _Requirements: 4.1, 4.2, 9.1_

  - [ ]* 6.4 Write unit test: sign-up input classes and autoComplete
    - Assert name input has `autoComplete="name"` and dark bg class
    - Assert email input has `autoComplete="email"` and dark bg class
    - Assert password input has `autoComplete="new-password"` and dark bg class
    - _Requirements: 4.4, 4.5, 9.6_

  - [ ]* 6.5 Write unit test: sign-up action wiring preserved
    - Assert form `action` prop is wired (formAction from `useActionState`)
    - Assert `<GoogleSignInButton>` receives `variant="dark"` and `signupIntent={true}`
    - _Requirements: 5.5, 7.4_

- [~] 7. Final checkpoint — all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- `src/app/auth/sign-in/actions.ts` and `src/app/auth/sign-up/actions.ts` are never touched
- The `.glass` class already lives in `globals.css` — no new CSS is added
- Tailwind v4 supports arbitrary value syntax (`bg-[rgba(...)]`, `border-white/15`, etc.) natively; no `tailwind.config` changes needed
- The `hero-glow-pulse` animation and `prefers-reduced-motion` pause are already handled by `globals.css`
- `Logo` component already supports `light={true}` for white wordmark — no changes needed to that component

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["1", "2"],
      "description": "Independent changes — GoogleSignInButton variant prop and AuthLayout two-panel shell can be implemented in parallel"
    },
    {
      "wave": 2,
      "tasks": ["3"],
      "description": "Checkpoint after wave 1 completes"
    },
    {
      "wave": 3,
      "tasks": ["4", "6"],
      "description": "SignInForm and SignUpForm restyling — both depend on Task 1 (variant prop) and Task 2 (new layout shell), can proceed in parallel"
    },
    {
      "wave": 4,
      "tasks": ["5", "7"],
      "description": "Final checkpoints"
    }
  ]
}
```
