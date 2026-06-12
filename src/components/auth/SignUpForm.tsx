"use client";

import Link from "next/link";
import { useState } from "react";
import { useActionState } from "react";
import { signUpWithEmail } from "@/app/auth/sign-up/actions";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { authInputClass } from "@/components/auth/auth-styles";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { passwordMeetsRequirements } from "@/lib/auth/password-requirements";
import { trackEvent } from "@/lib/analytics/track";

export function SignUpForm() {
  const [password, setPassword] = useState("");
  const [state, formAction, pending] = useActionState(signUpWithEmail, null);

  function handleEmailSubmit() {
    trackEvent("signup_started", { method: "email" });
  }

  const passwordOk = passwordMeetsRequirements(password);

  return (
    <div className="glass rounded-2xl p-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">
        CitePilot account
      </p>
      <h1 className="font-display mt-2 text-2xl font-bold text-white">
        Create account
      </h1>
      <p className="mt-2 mb-6 text-sm text-white/60">
        Add your domain now — we&apos;ll take you straight to your first citation
        audit.
      </p>

      <GoogleSignInButton
        label="Sign up with Google"
        callbackPath="/start"
        signupIntent
        variant="dark"
      />

      <AuthDivider />

      <form
        action={formAction}
        className="space-y-4"
        onSubmit={handleEmailSubmit}
      >
        <label className="block text-sm font-semibold text-white/70">
          Name
          <input
            name="name"
            type="text"
            required
            autoComplete="name"
            suppressHydrationWarning
            className={authInputClass}
          />
        </label>
        <label className="block text-sm font-semibold text-white/70">
          Work email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            suppressHydrationWarning
            className={authInputClass}
          />
        </label>
        <label className="block text-sm font-semibold text-white/70">
          Website domain
          <span className="mt-1 block text-xs font-normal text-white/45">
            We&apos;ll pre-fill onboarding — e.g. yourcompany.com
          </span>
          <input
            name="domain"
            type="text"
            required
            autoComplete="url"
            placeholder="yourcompany.com"
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
          />
          <div className="mt-3">
            <PasswordRequirements password={password} />
          </div>
        </div>
        {state?.error && <p className="text-sm text-red-300">{state.error}</p>}
        <AuthSubmitButton
          pending={pending}
          disabled={password.length > 0 && !passwordOk}
          pendingLabel="Creating account…"
          label="Create account"
        />
      </form>

      <p className="mt-6 text-center text-sm text-white/60">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="font-semibold text-accent">
          Sign in
        </Link>
      </p>
    </div>
  );
}
