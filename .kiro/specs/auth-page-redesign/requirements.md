# Requirements Document

## Introduction

CitePilot's auth pages (sign-in and sign-up) currently use a single-column centered layout on a light background. This feature redesigns them into a premium two-panel split layout that matches the existing dark, glowing aesthetic used on the marketing hero. The left panel is light and carries the brand story; the right panel is dark with a radial glow orb and contains the auth form. All server actions and auth logic remain unchanged — this is a pure UI/UX redesign.

## Glossary

- **Auth_Layout**: The Next.js layout component at `src/app/auth/layout.tsx` that wraps all auth routes
- **Left_Panel**: The light-background panel (visible on desktop/tablet) containing logo, headline, and value-prop content
- **Right_Panel**: The dark-background panel containing the radial glow orb and the auth form
- **Auth_Form**: Either the sign-in form (`SignInForm`) or the sign-up form (`SignUpForm`), rendered inside the Right_Panel
- **Glow_Orb**: The decorative radial gradient element rendered at the top of the Right_Panel using existing `.hero-premium-orb` CSS classes
- **GoogleSignInButton**: The existing client component at `src/components/auth/GoogleSignInButton.tsx`
- **Dark_Input**: An input field styled for the dark Right_Panel — dark surface background, light text, accent-colored focus ring
- **Dark_Google_Button**: The GoogleSignInButton variant styled for the dark Right_Panel — no white background, uses a translucent dark surface style
- **Value_Prop_Bullet**: A single feature highlight item shown in the Left_Panel (icon + text)
- **Sign_In_Page**: The route at `/auth/sign-in`
- **Sign_Up_Page**: The route at `/auth/sign-up`

---

## Requirements

### Requirement 1: Two-Panel Split Layout

**User Story:** As a prospective user, I want to see a polished two-panel auth screen, so that I feel confident in CitePilot's product quality before I sign up or sign in.

#### Acceptance Criteria

1. THE Auth_Layout SHALL render a full-viewport two-column grid with the Left_Panel occupying the left half and the Right_Panel occupying the right half on viewports 1024px wide and above.
2. WHEN the viewport width is below 1024px, THE Auth_Layout SHALL display only the Right_Panel in a single-column full-width layout.
3. WHEN the viewport width is below 1024px, THE Auth_Layout SHALL render the CitePilot logo above the Auth_Form within the Right_Panel.
4. THE Left_Panel SHALL use `--color-cream` (`#fafbfc`) as its background color.
5. THE Right_Panel SHALL use `--hero-bg` (`#04060c`) as its base background color.
6. THE Auth_Layout SHALL occupy the full viewport height (`100dvh`) without internal scrollbars on desktop viewports.

---

### Requirement 2: Left Panel Brand Content

**User Story:** As a prospective user, I want to read CitePilot's value proposition while I look at the auth form, so that I understand the product's benefits before committing to creating an account.

#### Acceptance Criteria

1. THE Left_Panel SHALL render the CitePilot logo using the existing `Logo` component at the top-left of the panel.
2. THE Left_Panel SHALL render a headline reading "Cite smarter, not harder" using the `font-display` (Plus Jakarta Sans) typeface at a minimum size of 2rem.
3. THE Left_Panel SHALL render exactly three Value_Prop_Bullets below the headline, each consisting of a decorative icon and a short descriptive label.
4. THE Left_Panel SHALL render the three Value_Prop_Bullets with the following content: "AI-powered citation tracking", "Instant brand visibility scores", and "Share-ready audit reports".
5. THE Left_Panel SHALL render a back link at the bottom of the panel that navigates to the marketing home page (`/`).
6. THE Left_Panel SHALL be hidden via CSS (`display: none` or equivalent) on viewports below 1024px wide.

---

### Requirement 3: Right Panel Dark Background with Glow Orb

**User Story:** As a user visiting the auth page, I want a visually premium dark panel with a glowing orb, so that the auth experience feels consistent with the rest of CitePilot's brand aesthetic.

#### Acceptance Criteria

1. THE Right_Panel SHALL apply the `.hero-premium` CSS class (or equivalent inline `background-image` gradient) to achieve the dark multi-layer radial gradient background.
2. THE Right_Panel SHALL render a Glow_Orb element using the `.hero-premium-orb` and `.hero-premium-orb--cyan` CSS classes positioned absolutely at the top of the panel.
3. THE Glow_Orb SHALL animate using the existing `hero-glow-pulse` keyframe animation defined in `globals.css`.
4. WHEN the user has enabled the operating-system reduced-motion preference, THE Glow_Orb animation SHALL be paused, consistent with the existing `@media (prefers-reduced-motion: reduce)` rule in `globals.css`.
5. THE Right_Panel SHALL center the Auth_Form card both horizontally and vertically within the panel.
6. THE Right_Panel SHALL clip overflow so the Glow_Orb does not extend outside the panel boundary.

---

### Requirement 4: Dark-Styled Auth Form Card

**User Story:** As a user filling in the auth form, I want the form fields and controls to be legible and well-contrasted on the dark background, so that I can complete the form without visual strain.

#### Acceptance Criteria

1. THE Auth_Form SHALL render inside a card container that uses the `.glass` CSS class (translucent dark surface with backdrop blur) defined in `globals.css`.
2. THE Auth_Form SHALL render a page heading ("Sign in" or "Create account") using white or near-white text (`#ffffff` or equivalent) against the dark card background.
3. THE Auth_Form SHALL render all label text in a light muted color (white at reduced opacity, minimum 70% opacity) to maintain WCAG AA contrast against the dark card background.
4. THE Dark_Input SHALL use a dark surface background (minimum contrast ratio 4.5:1 for input text against the input background per WCAG AA), white or near-white placeholder text, and a `2px solid var(--color-accent)` focus ring.
5. THE Dark_Input SHALL replace the existing light-mode input classes (`border-border bg-white text-ink`) used in `SignInForm` and `SignUpForm`.
6. THE Auth_Form submit button SHALL use `var(--color-mint)` (`#10b981`) as its background color and white text, replacing the current `bg-ink` dark submit button.
7. WHEN the submit button is in a disabled/pending state, THE Auth_Form submit button SHALL reduce opacity to 60% while retaining its mint background color.

---

### Requirement 5: Dark-Styled Google Sign-In Button

**User Story:** As a user who prefers Google OAuth, I want the Google button to look intentional on the dark panel rather than like a mismatched light element, so that the page feels visually cohesive.

#### Acceptance Criteria

1. THE Dark_Google_Button SHALL accept a `variant` prop on the `GoogleSignInButton` component with a value of `"dark"` to enable dark-panel styling.
2. WHEN `variant="dark"` is set, THE Dark_Google_Button SHALL render with a translucent dark surface background (`rgba(255,255,255,0.08)` or equivalent), a semi-transparent white border (`rgba(255,255,255,0.15)` or equivalent), and white label text.
3. WHEN `variant="dark"` is set and the button is in a hover state, THE Dark_Google_Button SHALL increase the background opacity to approximately `rgba(255,255,255,0.14)`.
4. WHEN `variant` is not provided or is `"light"`, THE Dark_Google_Button SHALL render with the existing white background styling, preserving backward compatibility for any other usage of `GoogleSignInButton` in the codebase.
5. THE `SignInForm` and `SignUpForm` components SHALL pass `variant="dark"` to the `GoogleSignInButton` within the redesigned Right_Panel.

---

### Requirement 6: Divider and Cross-Link Navigation

**User Story:** As a user on either the sign-in or sign-up page, I want a clear divider between OAuth and email options, and an easy link to switch between the two pages, so that I can choose my preferred auth method without confusion.

#### Acceptance Criteria

1. THE Auth_Form SHALL render an "or email" divider between the `Dark_Google_Button` and the email/password fields, using a horizontal rule style with text centered between two lines.
2. THE divider lines SHALL use a low-opacity white color (`rgba(255,255,255,0.12)` or equivalent) to remain subtle against the dark card.
3. THE divider label text SHALL read "or email" in a light muted color at reduced opacity, consistent with the dark card styling.
4. THE Sign_In_Page Auth_Form SHALL render a footer link reading "No account? Create one" that navigates to `/auth/sign-up`.
5. THE Sign_Up_Page Auth_Form SHALL render a footer link reading "Already have an account? Sign in" that navigates to `/auth/sign-in`.
6. THE cross-link footer text SHALL use white at reduced opacity for the non-link portion, and `var(--color-accent)` for the anchor link text.

---

### Requirement 7: Auth Logic and Server Action Preservation

**User Story:** As an engineer maintaining CitePilot, I want all authentication logic to remain functionally unchanged after the redesign, so that the risk of introducing auth regressions is zero.

#### Acceptance Criteria

1. THE Auth_Layout redesign SHALL NOT modify the `signInWithEmail` server action in `src/app/auth/sign-in/actions.ts`.
2. THE Auth_Layout redesign SHALL NOT modify the `signUpWithEmail` server action in `src/app/auth/sign-up/actions.ts`.
3. THE `SignInForm` component SHALL continue to use `useActionState(signInWithEmail, null)` for form state management after the redesign.
4. THE `SignUpForm` component SHALL continue to use `useActionState(signUpWithEmail, null)` for form state management after the redesign.
5. THE `GoogleSignInButton` component SHALL continue to call `authClient.signIn.social` with the same parameters (`provider`, `callbackURL`, `errorCallbackURL`) after the addition of the `variant` prop.
6. WHEN a `from` query parameter is present in the URL, THE Sign_In_Page SHALL continue to pass its value as a hidden form field to the `signInWithEmail` action unchanged.
7. IF the `error=google` query parameter is present, THEN THE Sign_In_Page SHALL continue to display the existing OAuth error message banner within the Auth_Form.

---

### Requirement 8: Responsive Mobile Layout

**User Story:** As a user on a mobile device, I want a clean auth experience without the marketing panel taking up space, so that the form is easy to reach and use on a small screen.

#### Acceptance Criteria

1. WHEN the viewport width is below 1024px, THE Auth_Layout SHALL render a single-column layout with the Right_Panel filling the full viewport width and height.
2. WHEN the viewport width is below 1024px, THE Right_Panel SHALL render the CitePilot logo (via the existing `Logo` component with `light={true}`) centered above the Auth_Form card.
3. WHEN the viewport width is below 1024px, THE Glow_Orb SHALL remain visible within the Right_Panel to preserve the brand aesthetic on mobile.
4. THE Auth_Form card on mobile SHALL be centered horizontally with a maximum width of 448px and horizontal padding of at least 1rem on each side.
5. WHEN the viewport width is below 1024px, THE Left_Panel SHALL not be rendered in the DOM (achieved via conditional rendering or `hidden` class) to avoid unnecessary content for screen readers and keyboard navigation.

---

### Requirement 9: Accessibility

**User Story:** As a user relying on assistive technology, I want the auth pages to remain accessible after the redesign, so that I can sign in or sign up without barriers.

#### Acceptance Criteria

1. THE Auth_Form heading (`h1`) SHALL be the first heading element within the Right_Panel DOM order, ensuring a logical heading hierarchy.
2. THE Glow_Orb decorative element SHALL carry `aria-hidden="true"` so screen readers skip it.
3. THE Left_Panel decorative icon elements within each Value_Prop_Bullet SHALL carry `aria-hidden="true"`.
4. THE Left_Panel back link (`← Back to CitePilot`) SHALL have an accessible label that communicates its destination.
5. ALL interactive elements (inputs, buttons, links) SHALL meet WCAG AA minimum contrast ratio of 4.5:1 for normal text against their respective backgrounds.
6. THE Auth_Form SHALL preserve existing `autoComplete` attribute values on all input fields (`email`, `current-password`, `new-password`, `name`) to support browser autofill.
