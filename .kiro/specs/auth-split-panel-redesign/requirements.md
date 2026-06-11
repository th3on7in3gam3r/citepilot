# Requirements Document

## Introduction

CitePilot's existing auth screens (sign-in and sign-up) are plain single-column centered forms on a cream background. This feature replaces that layout with a premium split-panel design: a light left panel containing the brand value proposition, and a dark right panel containing the form. The redesign must preserve all existing server action integrations without modification and introduce no new third-party dependencies.

## Glossary

- **Auth_Layout**: The Next.js layout component at `src/app/auth/layout.tsx` that wraps both sign-in and sign-up routes.
- **Left_Panel**: The light-background half of the split layout showing logo, headline, benefit bullets, and a back link.
- **Right_Panel**: The dark-background half of the split layout containing the Google OAuth button, email/password form, and sign-in/sign-up toggle link.
- **Orb**: A decorative radial-gradient glow element rendered at the top of the Right_Panel, using existing `hero-premium-orb` CSS classes.
- **SignInForm**: The client component at `src/app/auth/sign-in/SignInForm.tsx`.
- **SignUpForm**: The client component at `src/components/auth/SignUpForm.tsx`.
- **GoogleSignInButton**: The client component at `src/components/auth/GoogleSignInButton.tsx`.
- **Logo**: The component at `src/components/ui/Logo.tsx`, which accepts a `light` prop for white wordmark rendering.
- **CSS_Token**: A CSS custom property defined in `globals.css` (e.g. `--color-ink`, `--color-accent`, `--color-mint`, `--color-slate`).
- **Server_Action**: A Next.js `"use server"` function — `signInWithEmail` and `signUpWithEmail` — that must not be modified.

---

## Requirements

### Requirement 1: Split-Panel Layout

**User Story:** As a visitor, I want the auth screens to have a polished two-column layout, so that the product feels professional and trustworthy before I sign in.

#### Acceptance Criteria

1. THE Auth_Layout SHALL render a two-column layout where the Left_Panel occupies approximately half the viewport width and the Right_Panel occupies the remaining half on viewports ≥ 768 px wide.
2. WHEN the viewport width is less than 768 px, THE Auth_Layout SHALL collapse to a single-column layout displaying only the Right_Panel content with the Logo rendered above the form.
3. THE Left_Panel SHALL use a white or near-white background (`--color-surface` or `--color-cream`).
4. THE Right_Panel SHALL use a dark background of `#070b14` (`--color-ink`) as the base color.
5. THE Auth_Layout SHALL occupy the full viewport height (`100dvh`) with no external scroll.

---

### Requirement 2: Left Panel Content

**User Story:** As a visitor, I want to see CitePilot's value proposition on the left side of the auth screen, so that I understand what I'm signing up for.

#### Acceptance Criteria

1. THE Left_Panel SHALL display the Logo component with the `light` prop set to `false` (dark wordmark).
2. THE Left_Panel SHALL display a bold headline with the text "AI-powered citation intelligence" using the display font (`font-display`) at a size of at least `text-3xl`.
3. THE Left_Panel SHALL display a list of exactly three benefit items, each prefixed with a checkmark icon rendered in `--color-mint`.
4. THE Left_Panel SHALL display a "← Back to CitePilot" link that navigates to the site root (`/`), styled using `--color-muted` text with a `hover` state of `--color-ink`.
5. THE Left_Panel SHALL be hidden at viewport widths less than 768 px.

---

### Requirement 3: Right Panel Visual Treatment

**User Story:** As a visitor, I want the form panel to feel modern and distinctive with its dark theme, so that the interface is visually engaging.

#### Acceptance Criteria

1. THE Right_Panel SHALL render the Orb as a decorative element positioned at the top-center, using the existing `hero-premium-orb--cyan` CSS class (radial glow, `--color-accent` hue, `filter: blur(80px)`).
2. THE Right_Panel SHALL apply `overflow-hidden` so the Orb does not cause scroll or bleed outside the panel boundary.
3. WHEN `prefers-reduced-motion` is active, THE Right_Panel SHALL render the Orb without animation (`animation: none` is already handled by the global media query in `globals.css`).

---

### Requirement 4: Sign-In Form on Dark Panel

**User Story:** As a returning user, I want the sign-in form to be legible and accessible on the dark panel, so that I can sign in without friction.

#### Acceptance Criteria

1. THE SignInForm SHALL render inside the Right_Panel without its existing outer card wrapper (`rounded-2xl border bg-white p-8 shadow-sm`) — the panel itself provides the container.
2. THE SignInForm SHALL display a page title "Sign in" using `font-display`, white text, and `text-2xl font-bold`.
3. THE SignInForm SHALL display a subtitle "Access your citation dashboard and saved workspaces." in `--color-muted` text at `text-sm`.
4. WHEN a user submits the sign-in form, THE SignInForm SHALL invoke the `signInWithEmail` Server_Action unchanged.
5. THE SignInForm inputs SHALL use a semi-transparent dark surface background (`rgba(255,255,255,0.06)`), a subtle border (`rgba(255,255,255,0.12)`), white text, and a focus ring using `--color-accent`.
6. THE SignInForm submit button SHALL use `--color-mint` as its background color with white text, replacing the existing `bg-ink` style.
7. THE SignInForm SHALL display a "No account? Create one" toggle link pointing to `/auth/sign-up`, styled with `--color-accent` for the link text.

---

### Requirement 5: Sign-Up Form on Dark Panel

**User Story:** As a new user, I want the sign-up form to be legible and accessible on the dark panel, so that I can create an account without friction.

#### Acceptance Criteria

1. THE SignUpForm SHALL render inside the Right_Panel without its existing outer card wrapper — the sign-up page component SHALL be refactored to remove the `rounded-2xl border bg-white p-8 shadow-sm` wrapper.
2. THE SignUpForm page SHALL display a page title "Create account" using `font-display`, white text, and `text-2xl font-bold`.
3. THE SignUpForm page SHALL display a subtitle in `--color-muted` text at `text-sm`.
4. WHEN a user submits the sign-up form, THE SignUpForm SHALL invoke the `signUpWithEmail` Server_Action unchanged.
5. THE SignUpForm inputs SHALL use the same dark surface styling as defined in Requirement 4.5.
6. THE SignUpForm submit button SHALL use `--color-mint` as its background color with white text.
7. THE SignUpForm SHALL display an "Already have an account? Sign in" toggle link pointing to `/auth/sign-in`, styled with `--color-accent` for the link text.

---

### Requirement 6: Google OAuth Button Styling for Dark Panel

**User Story:** As a visitor, I want the Google sign-in button to look appropriate on the dark background, so that it is clearly readable and does not look out of place.

#### Acceptance Criteria

1. THE GoogleSignInButton SHALL accept a `variant` prop with values `"light"` (default, existing style) and `"dark"`.
2. WHEN `variant` is `"dark"`, THE GoogleSignInButton SHALL render with a semi-transparent white background (`rgba(255,255,255,0.08)`), a subtle white border (`rgba(255,255,255,0.15)`), and white text.
3. WHEN `variant` is `"dark"` and the button is hovered, THE GoogleSignInButton SHALL transition to a slightly more opaque background (`rgba(255,255,255,0.13)`).
4. THE GoogleSignInButton `variant` default SHALL remain `"light"` so no other usages in the codebase are affected.
5. THE Right_Panel SHALL pass `variant="dark"` when rendering the GoogleSignInButton inside either form.

---

### Requirement 7: Responsive Mobile Layout

**User Story:** As a mobile visitor, I want a clean single-column experience, so that I can sign in or sign up comfortably on a small screen.

#### Acceptance Criteria

1. WHEN the viewport width is less than 768 px, THE Auth_Layout SHALL render only the Right_Panel in full width.
2. WHEN the viewport width is less than 768 px, THE Auth_Layout SHALL render the Logo above the form content inside the Right_Panel, using `Logo` with `light` prop `true` (white wordmark on dark background).
3. WHEN the viewport width is less than 768 px, THE Left_Panel SHALL not be rendered (hidden via CSS, not removed from DOM to preserve SSR).
4. THE Right_Panel SHALL be vertically scrollable on mobile if form content exceeds the viewport height (`overflow-y: auto`).

---

### Requirement 8: Accessibility

**User Story:** As a user with accessibility needs, I want the auth screens to meet baseline accessibility standards, so that I can use them with assistive technologies.

#### Acceptance Criteria

1. THE Auth_Layout SHALL ensure each page has exactly one `<h1>` element (the form title "Sign in" or "Create account").
2. THE SignInForm and SignUpForm inputs SHALL each have an associated `<label>` element that is either visually present or visually hidden with appropriate `htmlFor`/`id` linkage.
3. THE Right_Panel Orb element SHALL carry `aria-hidden="true"` so screen readers ignore the decorative element.
4. WHEN an error message is displayed, THE SignInForm and SignUpForm SHALL render the error in an element with `role="alert"` so screen readers announce it immediately.
5. THE Auth_Layout split-panel container SHALL not trap keyboard focus — tab order SHALL flow naturally from Left_Panel to Right_Panel.

---

### Requirement 9: No New Dependencies

**User Story:** As a developer, I want the redesign to use only existing project dependencies, so that bundle size and maintenance burden are not increased.

#### Acceptance Criteria

1. THE Auth_Layout redesign SHALL use only CSS classes, inline styles, and utilities already present in `globals.css` and Tailwind CSS v4 for all visual effects.
2. THE Orb effect SHALL be implemented using the existing `hero-premium-orb` and `hero-premium-orb--cyan` CSS classes defined in `globals.css` — no new CSS files SHALL be introduced.
3. IF any new utility classes are needed, THE Auth_Layout SHALL define them inside `globals.css` using the existing token system.
