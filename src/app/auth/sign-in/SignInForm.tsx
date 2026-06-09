"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { signInWithEmail } from "./actions";

export function SignInForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/dashboard";
  const oauthError = searchParams.get("error") === "google";
  const [state, formAction, pending] = useActionState(signInWithEmail, null);

  return (
    <div className="glass rounded-2xl p-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">
        CitePilot account
      </p>
      <h1 className="font-display mt-2 text-2xl font-bold text-white">
        Sign in
      </h1>
      <p className="mt-2 text-sm text-white/60">
        Access your citation dashboard and saved workspaces.
      </p>

      <div className="mt-6">
        <GoogleSignInButton variant="dark" />
      </div>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-white/[0.12]" />
        <span className="text-xs font-medium uppercase tracking-wide text-white/50">
          or email
        </span>
        <span className="h-px flex-1 bg-white/[0.12]" />
      </div>

      {oauthError && (
        <p className="mb-4 rounded-xl border border-red-500/40 bg-red-900/30 px-4 py-3 text-sm text-red-300">
          Google sign-in was canceled or failed. Try again or use email below.
        </p>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="from" value={from} />
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
            autoComplete="current-password"
            suppressHydrationWarning
            className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-white/50 outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
          />
        </label>
        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-[#10b981] py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/60">
        No account?{" "}
        <Link href="/auth/sign-up" className="font-semibold text-accent">
          Create one
        </Link>
      </p>
    </div>
  );
}
