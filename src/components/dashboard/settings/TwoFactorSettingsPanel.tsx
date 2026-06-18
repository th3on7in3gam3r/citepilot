"use client";

import { useCallback, useEffect, useState } from "react";
import { Panel } from "@/components/dashboard/DashboardUI";
import { useToast } from "@/components/notifications/ToastProvider";

type TotpStatus = {
  enabled: boolean;
  enabledAt: string | null;
  backupCodesRemaining: number;
  lockedUntil: string | null;
};

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-[#333] dark:bg-[#141414]";

type Step = "idle" | "setup" | "verify" | "backup" | "disable" | "regenerate";

export function TwoFactorSettingsPanel({
  require2fa = false,
}: {
  require2fa?: boolean;
}) {
  const toast = useToast();
  const [status, setStatus] = useState<TotpStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("idle");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [manualKey, setManualKey] = useState("");
  const [token, setToken] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [maskedCodes, setMaskedCodes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/security/2fa/status", { credentials: "include" });
      if (!res.ok) {
        setStatus(null);
        return;
      }
      setStatus((await res.json()) as TotpStatus);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  async function startSetup() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/security/2fa/setup", {
        method: "POST",
        credentials: "include",
      });
      const json = (await res.json()) as {
        error?: string;
        qrCodeDataUrl?: string;
        manualKey?: string;
      };
      if (!res.ok) {
        setError(json.error ?? "Could not start setup");
        return;
      }
      setQrCodeDataUrl(json.qrCodeDataUrl ?? null);
      setManualKey(json.manualKey ?? "");
      setStep("setup");
    } finally {
      setBusy(false);
    }
  }

  async function verifyEnable(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/security/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token }),
      });
      const json = (await res.json()) as {
        error?: string;
        backupCodes?: string[];
      };
      if (!res.ok) {
        setError(json.error ?? "Invalid code");
        return;
      }
      setBackupCodes(json.backupCodes ?? []);
      setStep("backup");
      await loadStatus();
      toast.success("Two-factor authentication enabled");
    } finally {
      setBusy(false);
    }
  }

  async function disableTotp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/security/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Could not disable 2FA");
        return;
      }
      setToken("");
      setStep("idle");
      await loadStatus();
      toast.success("Two-factor authentication disabled");
    } finally {
      setBusy(false);
    }
  }

  async function loadMaskedCodes() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/security/2fa/backup-codes", {
        credentials: "include",
      });
      const json = (await res.json()) as { error?: string; codes?: string[] };
      if (!res.ok) {
        setError(json.error ?? "Could not load backup codes");
        return;
      }
      setMaskedCodes(json.codes ?? []);
      setStep("regenerate");
    } finally {
      setBusy(false);
    }
  }

  async function regenerateCodes(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/security/2fa/backup-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token }),
      });
      const json = (await res.json()) as {
        error?: string;
        backupCodes?: string[];
      };
      if (!res.ok) {
        setError(json.error ?? "Could not regenerate codes");
        return;
      }
      setBackupCodes(json.backupCodes ?? []);
      setToken("");
      setStep("backup");
      await loadStatus();
      toast.success("Backup codes regenerated");
    } finally {
      setBusy(false);
    }
  }

  function downloadBackupCodes(codes: string[]) {
    const blob = new Blob(
      [
        `CitePilot backup codes\nGenerated: ${new Date().toISOString()}\n\n${codes.join("\n")}\n`,
      ],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "citepilot-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <Panel title="Two-factor authentication">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-2/3 rounded bg-surface" />
          <div className="h-10 rounded-xl bg-surface" />
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Two-factor authentication">
      {require2fa && !status?.enabled && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100"
        >
          Your Fleet workspace requires two-factor authentication. Enable 2FA below
          to access the dashboard.
        </div>
      )}

      {step === "idle" && (
        <>
          <p className="text-sm text-muted">
            Protect your account with an authenticator app (Google Authenticator,
            Authy, 1Password, etc.).
          </p>
          {status?.enabled ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-ink">
                2FA is <strong>enabled</strong>
                {status.enabledAt
                  ? ` since ${new Date(status.enabledAt).toLocaleDateString()}`
                  : ""}
                . {status.backupCodesRemaining} backup code
                {status.backupCodesRemaining === 1 ? "" : "s"} remaining.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void loadMaskedCodes()}
                  disabled={busy}
                  className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink hover:bg-surface disabled:opacity-60"
                >
                  View backup codes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("disable");
                    setError(null);
                    setToken("");
                  }}
                  className="rounded-full border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-500/10"
                >
                  Disable 2FA
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void startSetup()}
              disabled={busy}
              className="mt-4 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-60"
            >
              Enable 2FA
            </button>
          )}
        </>
      )}

      {step === "setup" && (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Scan this QR code with your authenticator app, or enter the manual key
            below.
          </p>
          {qrCodeDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrCodeDataUrl}
              alt="Authenticator QR code"
              className="mx-auto h-48 w-48 rounded-xl border border-border bg-white p-3"
            />
          )}
          <p className="rounded-xl bg-surface px-4 py-3 text-center font-mono text-sm tracking-widest text-ink">
            {manualKey}
          </p>
          <button
            type="button"
            onClick={() => {
              setStep("verify");
              setToken("");
              setError(null);
            }}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white"
          >
            Next: verify code
          </button>
        </div>
      )}

      {step === "verify" && (
        <form onSubmit={verifyEnable} className="space-y-4">
          <label className="block text-sm font-medium text-ink">
            Enter the 6-digit code from your app
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              className={inputClass}
              placeholder="000000"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Verifying…" : "Verify & enable"}
          </button>
        </form>
      )}

      {step === "backup" && backupCodes.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
            Store these backup codes somewhere safe — they will not be shown again.
          </p>
          <ul className="grid gap-2 rounded-xl border border-border bg-surface p-4 font-mono text-sm">
            {backupCodes.map((code) => (
              <li key={code}>{code}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => downloadBackupCodes(backupCodes)}
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
            >
              Download codes
            </button>
            <button
              type="button"
              onClick={() => {
                setBackupCodes([]);
                setStep("idle");
              }}
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {step === "disable" && (
        <form onSubmit={disableTotp} className="space-y-4">
          <p className="text-sm text-muted">
            Enter your current authenticator code to disable two-factor authentication.
          </p>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            className={inputClass}
            placeholder="000000"
          />
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Disable 2FA
            </button>
            <button
              type="button"
              onClick={() => setStep("idle")}
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {step === "regenerate" && (
        <form onSubmit={regenerateCodes} className="space-y-4">
          <p className="text-sm text-muted">
            Remaining backup codes (masked). Enter your authenticator code to
            regenerate new codes — old codes will stop working.
          </p>
          <ul className="rounded-xl border border-border bg-surface p-4 font-mono text-sm">
            {maskedCodes.map((code, i) => (
              <li key={`${code}-${i}`}>{code}</li>
            ))}
          </ul>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            className={inputClass}
            placeholder="000000"
          />
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Regenerate codes
            </button>
            <button
              type="button"
              onClick={() => setStep("idle")}
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </Panel>
  );
}
