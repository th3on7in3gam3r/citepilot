"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useActionState } from "react";
import { signUpWithEmail } from "@/app/auth/sign-up/actions";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { AuthErrorAlert } from "@/components/auth/AuthErrorAlert";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { authFormCardClass, authInputClass, authLabelClass } from "@/components/auth/auth-styles";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { passwordMeetsRequirements } from "@/lib/auth/password-requirements";
import { DEFAULT_POST_AUTH_PATH, resolveAuthRedirect } from "@/lib/auth/redirect";
import { trackEvent } from "@/lib/analytics/track";

export function SignUpForm() {
  const searchParams = useSearchParams();
  const from = resolveAuthRedirect(searchParams.get("from"));
  const initialDomain = searchParams.get("domain") ?? "";
  const [domain, setDomain] = useState(initialDomain);
  const [password, setPassword] = useState("");
  const [state, formAction, pending] = useActionState(signUpWithEmail, null);

  useEffect(() => {
    if (initialDomain) setDomain(initialDomain);
  }, [initialDomain]);

  function handleEmailSubmit() {
    trackEvent("signup_started", { method: "email" });
  }

  const passwordOk = passwordMeetsRequirements(password);
  const signInHref =
    from !== DEFAULT_POST_AUTH_PATH
      ? `/auth/sign-in?from=${encodeURIComponent(from)}`
      : "/auth/sign-in";

  return (
    <div className={authFormCardClass}>
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">
        CitePilot account
      </p>
      <h1 className="font-display mt-2 text-2xl font-bold text-ink">
        Create account
      </h1>
      <p className="mt-2 mb-6 text-sm text-muted">
        Add your domain now — we&apos;ll take you straight to your first citation
        audit.
      </p>

      <GoogleSignInButton
        label="Sign up with Google"
        callbackPath={DEFAULT_POST_AUTH_PATH}
        callbackDomain={domain.trim() || undefined}
        signupIntent
        variant="light"
      />

      <AuthDivider />

      <form
        action={formAction}
        className="space-y-4"
        onSubmit={handleEmailSubmit}
        noValidate
      >
        <input type="hidden" name="from" value={from} />
        <label htmlFor="sign-up-name" className={authLabelClass}>
          Name
          <input
            id="sign-up-name"
            name="name"
            type="text"
            required
            aria-required="true"
            autoComplete="name"
            suppressHydrationWarning
            className={authInputClass}
          />
        </label>
        <label htmlFor="sign-up-email" className={authLabelClass}>
          Work email
          <input
            id="sign-up-email"
            name="email"
            type="email"
            required
            aria-required="true"
            autoComplete="email"
            suppressHydrationWarning
            aria-invalid={Boolean(state?.error)}
            aria-describedby={state?.error ? "sign-up-error" : undefined}
            className={authInputClass}
          />
        </label>
        <label htmlFor="sign-up-domain" className={authLabelClass}>
          Website domain
          <span className="mt-1 block text-xs font-normal text-muted">
            We&apos;ll pre-fill onboarding — e.g. yourcompany.com
          </span>
          <input
            id="sign-up-domain"
            name="domain"
            type="text"
            required
            aria-required="true"
            autoComplete="url"
            placeholder="yourcompany.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            suppressHydrationWarning
            className={authInputClass}
          />
        </label>
        <div>
          <PasswordField
            label="Password"
            autoComplete="new-password"
            minLength={8}
            onChange={setPassword}
            invalid={Boolean(state?.error)}
            describedBy={state?.error ? "sign-up-error" : undefined}
          />
          <div className="mt-3">
            <PasswordRequirements password={password} />
          </div>
        </div>
        {state?.error && (
          <AuthErrorAlert id="sign-up-error">{state.error}</AuthErrorAlert>
        )}
        <AuthSubmitButton
          pending={pending}
          disabled={password.length > 0 && !passwordOk}
          pendingLabel="Creating account…"
          label="Create account"
        />
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href={signInHref} className="font-semibold text-accent">
          Sign in
        </Link>
      </p>
    </div>
  );
}
