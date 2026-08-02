"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthErrorAlert } from "@/components/auth/AuthErrorAlert";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { AuthSuccessAlert } from "@/components/auth/AuthSuccessAlert";
import { authFormCardClass, authInputClass, authLabelClass } from "@/components/auth/auth-styles";
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
    <div className={authFormCardClass}>
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">
        Account recovery
      </p>
      <h1 className="font-display mt-2 text-2xl font-bold text-ink">
        Reset your password
      </h1>
      <p className="mt-2 text-sm text-muted">
        Enter your email and we&apos;ll send a reset link if an account exists.
      </p>

      {status === "sent" ? (
        <div className="mt-6">
          <AuthSuccessAlert id="forgot-password-sent" title="Check your inbox">
            <p>
              If an account exists for {email}, you&apos;ll receive password reset
              instructions shortly.
            </p>
            <Link
              href="/auth/sign-in"
              className="mt-4 inline-block font-semibold text-accent hover:text-accent-deep"
            >
              Back to sign in →
            </Link>
          </AuthSuccessAlert>
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4" noValidate>
          <label htmlFor="forgot-password-email" className={authLabelClass}>
            Email
            <input
              id="forgot-password-email"
              name="email"
              type="email"
              required
              aria-required="true"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "forgot-password-error" : undefined}
              className={authInputClass}
            />
          </label>
          {error && (
            <AuthErrorAlert id="forgot-password-error">{error}</AuthErrorAlert>
          )}
          <AuthSubmitButton
            pending={status === "loading"}
            pendingLabel="Sending…"
            label="Send reset link"
          />
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/auth/sign-in" className="font-semibold text-accent hover:text-accent-deep">
          ← Back to sign in
        </Link>
      </p>
    </div>
  );
}
