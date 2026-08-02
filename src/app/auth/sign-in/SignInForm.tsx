"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { AuthErrorAlert } from "@/components/auth/AuthErrorAlert";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { authFormCardClass, authInputClass, authLabelClass } from "@/components/auth/auth-styles";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { PasswordField } from "@/components/auth/PasswordField";
import { DEFAULT_POST_AUTH_PATH, resolveAuthRedirect } from "@/lib/auth/redirect";
import { signInWithEmail } from "./actions";

export function SignInForm() {
  const searchParams = useSearchParams();
  const from = resolveAuthRedirect(
    searchParams.get("from") ?? searchParams.get("redirect"),
  );
  const oauthError = searchParams.get("error") === "google";
  const [state, formAction, pending] = useActionState(signInWithEmail, null);

  const signUpHref =
    from !== DEFAULT_POST_AUTH_PATH
      ? `/auth/sign-up?from=${encodeURIComponent(from)}`
      : "/auth/sign-up";

  return (
    <div className={authFormCardClass}>
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">
        CitePilot account
      </p>
      <h1 className="font-display mt-2 text-2xl font-bold text-ink">Sign in</h1>
      <p className="mt-2 text-sm text-muted">
        Access your citation dashboard and saved workspaces.
      </p>

      <div className="mt-6">
        <GoogleSignInButton variant="light" callbackPath={DEFAULT_POST_AUTH_PATH} />
      </div>

      <AuthDivider />

      {oauthError && (
        <div className="mb-4">
          <AuthErrorAlert id="sign-in-oauth-error">
            Google sign-in was canceled or failed. Try again or use email below.
          </AuthErrorAlert>
        </div>
      )}

      <form action={formAction} className="space-y-4" noValidate>
        <input type="hidden" name="from" value={from} />
        <label htmlFor="sign-in-email" className={authLabelClass}>
          Email
          <input
            id="sign-in-email"
            name="email"
            type="email"
            required
            aria-required="true"
            autoComplete="email"
            suppressHydrationWarning
            aria-invalid={Boolean(state?.error)}
            aria-describedby={state?.error ? "sign-in-error" : undefined}
            className={authInputClass}
          />
        </label>

        <div>
          <PasswordField
            label="Password"
            autoComplete="current-password"
            invalid={Boolean(state?.error)}
            describedBy={state?.error ? "sign-in-error" : undefined}
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <label htmlFor="sign-in-remember" className="flex cursor-pointer items-center gap-2 text-sm text-muted">
              <input
                id="sign-in-remember"
                type="checkbox"
                name="rememberMe"
                defaultChecked
                className="h-4 w-4 rounded border-border bg-card text-accent focus:ring-accent/30"
              />
              Stay signed in
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-sm font-semibold text-accent hover:text-accent-deep"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {state?.error && (
          <AuthErrorAlert id="sign-in-error">{state.error}</AuthErrorAlert>
        )}

        <AuthSubmitButton
          pending={pending}
          pendingLabel="Signing in…"
          label="Sign in"
        />
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        No account?{" "}
        <Link href={signUpHref} className="font-semibold text-accent">
          Create one
        </Link>
      </p>
    </div>
  );
}
