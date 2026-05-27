"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpWithEmail } from "@/app/auth/sign-up/actions";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { trackEvent } from "@/lib/analytics/track";

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUpWithEmail, null);

  function handleEmailSubmit() {
    trackEvent("signup_started", { method: "email" });
  }

  return (
    <>
      <GoogleSignInButton
        label="Sign up with Google"
        callbackPath="/start"
        signupIntent
      />

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          or email
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={formAction} className="space-y-4" onSubmit={handleEmailSubmit}>
        <label className="block text-sm font-semibold text-ink">
          Name
          <input
            name="name"
            type="text"
            required
            autoComplete="name"
            className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <label className="block text-sm font-semibold text-ink">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <label className="block text-sm font-semibold text-ink">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-ink py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="font-semibold text-accent">
          Sign in
        </Link>
      </p>
    </>
  );
}
