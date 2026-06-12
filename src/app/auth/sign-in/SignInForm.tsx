"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { authInputClass } from "@/components/auth/auth-styles";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { PasswordField } from "@/components/auth/PasswordField";
import { signInWithEmail } from "./actions";

export function SignInForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? searchParams.get("redirect") ?? "/dashboard";
  const oauthError = searchParams.get("error") === "google";
  const [state, formAction, pending] = useActionState(signInWithEmail, null);

  return (
    <div className="glass rounded-2xl p-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">
        CitePilot account
      </p>
      <h1 className="font-display mt-2 text-2xl font-bold text-white">Sign in</h1>
      <p className="mt-2 text-sm text-white/60">
        Access your citation dashboard and saved workspaces.
      </p>

      <div className="mt-6">
        <GoogleSignInButton variant="dark" />
      </div>

      <AuthDivider />

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
            className={authInputClass}
          />
        </label>

        <div>
          <PasswordField label="Password" autoComplete="current-password" />
          <div className="mt-2 flex items-center justify-between gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-white/60">
              <input
                type="checkbox"
                name="rememberMe"
                defaultChecked
                className="h-4 w-4 rounded border-white/20 bg-white/10 text-accent focus:ring-accent/30"
              />
              Stay signed in
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-sm font-semibold text-glow hover:text-white"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {state?.error && (
          <p className="text-sm text-red-300">{state.error}</p>
        )}

        <AuthSubmitButton
          pending={pending}
          pendingLabel="Signing in…"
          label="Sign in"
        />
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
