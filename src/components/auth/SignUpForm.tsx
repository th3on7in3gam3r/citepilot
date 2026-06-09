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
    <div className="glass rounded-2xl p-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">CitePilot account</p>
      <h1 className="font-display mt-2 text-2xl font-bold text-white">Create account</h1>
      <p className="mt-2 mb-6 text-sm text-white/60">Start tracking your AI citation footprint today.</p>

      <GoogleSignInButton
        label="Sign up with Google"
        callbackPath="/start"
        signupIntent
        variant="dark"
      />

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-white/[0.12]" />
        <span className="text-xs font-medium uppercase tracking-wide text-white/50">
          or email
        </span>
        <span className="h-px flex-1 bg-white/[0.12]" />
      </div>

      <form action={formAction} className="space-y-4" onSubmit={handleEmailSubmit}>
        <label className="block text-sm font-semibold text-white/70">
          Name
          <input
            name="name"
            type="text"
            required
            autoComplete="name"
            suppressHydrationWarning
            className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-white/50 outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
          />
        </label>
        <label className="block text-sm font-semibold text-white/70">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            suppressHydrationWarning
            className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-white/50 outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
          />
        </label>
        <label className="block text-sm font-semibold text-white/70">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            suppressHydrationWarning
            className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-white/50 outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
          />
        </label>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-[#10b981] py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Creating account…" : "Create account"}
        </button>
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
