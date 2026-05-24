"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { signInWithEmail } from "./actions";

export function SignInForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/dashboard";
  const [state, formAction, pending] = useActionState(signInWithEmail, null);

  return (
    <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">
        CitePilot account
      </p>
      <h1 className="font-display mt-2 text-2xl font-bold text-ink">
        Sign in
      </h1>
      <p className="mt-2 text-sm text-muted">
        Access your citation dashboard and saved workspaces.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <input type="hidden" name="from" value={from} />
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
            autoComplete="current-password"
            className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>
        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-ink py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        No account?{" "}
        <Link href="/auth/sign-up" className="font-semibold text-accent">
          Create one
        </Link>
      </p>
    </div>
  );
}
