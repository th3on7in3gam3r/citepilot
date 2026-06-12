"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { authClient } from "@/lib/auth/client";
import { passwordMeetsRequirements } from "@/lib/auth/password-requirements";

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
      <div className="glass rounded-2xl p-8 text-center">
        <h1 className="font-display text-xl font-bold text-white">
          Invalid reset link
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Request a new password reset email to continue.
        </p>
        <Link
          href="/auth/forgot-password"
          className="mt-6 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white"
        >
          Request reset link
        </Link>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <h1 className="font-display text-xl font-bold text-white">
          Password updated
        </h1>
        <p className="mt-2 text-sm text-white/60">
          You can sign in with your new password.
        </p>
        <Link
          href="/auth/sign-in"
          className="mt-6 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">
        Account recovery
      </p>
      <h1 className="font-display mt-2 text-2xl font-bold text-white">
        Choose a new password
      </h1>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
        <div>
          <PasswordField
            label="New password"
            autoComplete="new-password"
            minLength={8}
            onChange={setPassword}
          />
          <div className="mt-3">
            <PasswordRequirements password={password} />
          </div>
        </div>
        {error && <p className="text-sm text-red-300">{error}</p>}
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
