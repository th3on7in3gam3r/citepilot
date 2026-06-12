"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { authInputClass } from "@/components/auth/auth-styles";
import { authClient } from "@/lib/auth/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setError(null);

    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/reset-password`
          : undefined;
      const { error: resetError } = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo,
      });
      if (resetError) {
        setError(resetError.message ?? "Could not send reset email");
        setStatus("error");
        return;
      }
      setStatus("sent");
    } catch {
      setError("Something went wrong — try again");
      setStatus("error");
    }
  }

  return (
    <div className="glass rounded-2xl p-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">
        Account recovery
      </p>
      <h1 className="font-display mt-2 text-2xl font-bold text-white">
        Reset your password
      </h1>
      <p className="mt-2 text-sm text-white/60">
        Enter your email and we&apos;ll send a reset link if an account exists.
      </p>

      {status === "sent" ? (
        <div className="mt-6 rounded-xl border border-mint/30 bg-mint/10 px-4 py-4 text-sm text-white/80">
          <p className="font-semibold text-mint">Check your inbox</p>
          <p className="mt-2">
            If an account exists for {email}, you&apos;ll receive password reset
            instructions shortly.
          </p>
          <Link
            href="/auth/sign-in"
            className="mt-4 inline-block font-semibold text-glow hover:text-white"
          >
            Back to sign in →
          </Link>
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-white/70">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={authInputClass}
            />
          </label>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <AuthSubmitButton
            pending={status === "loading"}
            pendingLabel="Sending…"
            label="Send reset link"
          />
        </form>
      )}

      <p className="mt-6 text-center text-sm text-white/60">
        <Link href="/auth/sign-in" className="font-semibold text-accent">
          ← Back to sign in
        </Link>
      </p>
    </div>
  );
}
