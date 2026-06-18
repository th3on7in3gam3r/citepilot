"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { authFormCardClass, authInputClass, authLabelClass } from "@/components/auth/auth-styles";

export function TwoFactorChallengeForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/dashboard";
  const [useBackup, setUseBackup] = useState(false);
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, from }),
      });
      const json = (await res.json()) as {
        error?: string;
        redirectTo?: string;
      };
      if (!res.ok) {
        setError(json.error ?? "Verification failed");
        return;
      }
      window.location.assign(json.redirectTo ?? from);
    } catch {
      setError("Verification failed — try again");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={authFormCardClass}>
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">
        Two-factor authentication
      </p>
      <h1 className="font-display mt-2 text-2xl font-bold text-ink">
        Verify your identity
      </h1>
      <p className="mt-2 text-sm text-muted">
        Enter the 6-digit code from your authenticator app to continue.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label htmlFor="totp-token" className={authLabelClass}>
          {useBackup ? "Backup code" : "Authenticator code"}
          <input
            id="totp-token"
            name="token"
            type="text"
            inputMode={useBackup ? "text" : "numeric"}
            autoComplete="one-time-code"
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={useBackup ? "XXXXX-XXXXX" : "000000"}
            className={authInputClass}
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-red-300">
            {error}
          </p>
        )}

        <AuthSubmitButton
          pending={pending}
          pendingLabel="Verifying…"
          label="Continue"
        />
      </form>

      <button
        type="button"
        onClick={() => {
          setUseBackup((v) => !v);
          setToken("");
          setError(null);
        }}
        className="mt-4 text-sm font-semibold text-accent hover:text-accent-deep"
      >
        {useBackup ? "Use authenticator code instead" : "Use a backup code instead"}
      </button>
    </div>
  );
}
