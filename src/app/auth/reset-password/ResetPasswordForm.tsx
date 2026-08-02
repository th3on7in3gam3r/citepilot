"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthErrorAlert } from "@/components/auth/AuthErrorAlert";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { authFormCardClass, authSubmitClass } from "@/components/auth/auth-styles";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { authClient } from "@/lib/auth/client";
import { passwordMeetsRequirements } from "@/lib/auth/password-requirements";

function AuthPrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={`inline-flex ${authSubmitClass} px-6 no-underline`}>
      {children}
    </Link>
  );
}

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  const passwordOk = passwordMeetsRequirements(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError("Reset link is invalid or expired. Request a new one.");
      setStatus("error");
      return;
    }
    if (!passwordOk) return;

    setStatus("loading");
    setError(null);

    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: password,
        token,
      });
      if (resetError) {
        setError(resetError.message ?? "Could not reset password");
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setError("Something went wrong — try again");
      setStatus("error");
    }
  }

  if (!token) {
    return (
      <div className={`${authFormCardClass} text-center`}>
        <h1 className="font-display text-xl font-bold text-ink">
          Invalid reset link
        </h1>
        <p className="mt-2 text-sm text-muted">
          Request a new password reset email to continue.
        </p>
        <div className="mt-6">
          <AuthPrimaryLink href="/auth/forgot-password">
            Request reset link
          </AuthPrimaryLink>
        </div>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className={`${authFormCardClass} text-center`}>
        <h1 className="font-display text-xl font-bold text-ink">
          Password updated
        </h1>
        <p className="mt-2 text-sm text-muted">
          You can sign in with your new password.
        </p>
        <div className="mt-6">
          <AuthPrimaryLink href="/auth/sign-in">Sign in</AuthPrimaryLink>
        </div>
      </div>
    );
  }

  return (
    <div className={authFormCardClass}>
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">
        Account recovery
      </p>
      <h1 className="font-display mt-2 text-2xl font-bold text-ink">
        Choose a new password
      </h1>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4" noValidate>
        <div>
          <PasswordField
            label="New password"
            autoComplete="new-password"
            minLength={8}
            onChange={setPassword}
            invalid={Boolean(error)}
            describedBy={error ? "reset-password-error" : undefined}
          />
          <div className="mt-3">
            <PasswordRequirements password={password} />
          </div>
        </div>
        {error && (
          <AuthErrorAlert id="reset-password-error">{error}</AuthErrorAlert>
        )}
        <AuthSubmitButton
          pending={status === "loading"}
          disabled={password.length > 0 && !passwordOk}
          pendingLabel="Saving…"
          label="Update password"
        />
      </form>
    </div>
  );
}
