"use client";

import { redirectHomeAfterSignOut } from "@/lib/i18n/locale-cookie";
import { useEffect, useState } from "react";
import { Panel } from "@/components/dashboard/DashboardUI";
import { useToast } from "@/components/notifications/ToastProvider";
import { authClient } from "@/lib/auth/client";

type Step = "idle" | "warning" | "confirm" | "verify";

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-[#333] dark:bg-[#141414]";

export function AccountDeletePanel() {
  const toast = useToast();
  const [step, setStep] = useState<Step>("idle");
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [totpToken, setTotpToken] = useState("");
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [exportJobId, setExportJobId] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/security/2fa/status", { credentials: "include" })
      .then((r) => r.json())
      .then((json: { enabled?: boolean }) => setTotpEnabled(Boolean(json.enabled)))
      .catch(() => setTotpEnabled(false));
  }, []);

  useEffect(() => {
    if (!exportJobId || exportStatus === "ready" || exportStatus === "failed") {
      return;
    }
    const timer = window.setInterval(async () => {
      const res = await fetch(`/api/account/export/${exportJobId}`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const json = (await res.json()) as {
        status?: string;
        downloadUrl?: string | null;
      };
      setExportStatus(json.status ?? null);
      if (json.status === "ready" && json.downloadUrl) {
        window.location.assign(json.downloadUrl);
      }
    }, 2000);
    return () => window.clearInterval(timer);
  }, [exportJobId, exportStatus]);

  async function startExport() {
    setBusy(true);
    try {
      const res = await fetch("/api/account/export", {
        method: "POST",
        credentials: "include",
      });
      const json = (await res.json()) as { jobId?: string; error?: string };
      if (!res.ok || !json.jobId) {
        toast.error(json.error ?? "Export failed");
        return;
      }
      setExportJobId(json.jobId);
      setExportStatus("processing");
      toast.success("Preparing your data export…");
    } finally {
      setBusy(false);
    }
  }

  async function deleteAccount() {
    setBusy(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          confirm: confirmText,
          password: totpEnabled ? undefined : password,
          totpToken: totpEnabled ? totpToken : undefined,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(json.error ?? "Could not delete account");
        return;
      }
      try {
        await authClient.signOut();
      } catch {
        /* ignore */
      }
      redirectHomeAfterSignOut("deleted=1");
    } finally {
      setBusy(false);
    }
  }

  if (step === "idle") {
    return (
      <Panel title="Delete account">
        <p className="text-sm text-muted">
          Permanently delete your CitePilot account and all associated data (GDPR
          right to erasure). We process deletion within 30 days; you can cancel
          within 7 days via email.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void startExport()}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink hover:bg-surface disabled:opacity-60"
          >
            Download your data first
          </button>
          <button
            type="button"
            onClick={() => setStep("warning")}
            className="rounded-full border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-500/10"
          >
            Delete my account
          </button>
        </div>
        {exportStatus === "processing" && (
          <p className="mt-3 text-sm text-muted">
            Your export will be ready in ~30 seconds…
          </p>
        )}
      </Panel>
    );
  }

  if (step === "warning") {
    return (
      <Panel title="Delete account">
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-ink">
          <p className="font-semibold text-red-700 dark:text-red-300">
            Deleting your account will permanently remove:
          </p>
          <ul className="mt-3 space-y-1.5 text-muted">
            <li>✗ All your workspaces and citation data</li>
            <li>✗ All audit history and reports</li>
            <li>✗ Your subscription (no refund for unused period)</li>
            <li>✗ All shared report links will stop working</li>
          </ul>
          <p className="mt-3 font-semibold text-red-700 dark:text-red-300">
            This cannot be undone.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStep("idle")}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setStep("confirm")}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            I understand, continue →
          </button>
        </div>
      </Panel>
    );
  }

  if (step === "confirm") {
    return (
      <Panel title="Delete account">
        <label className="block text-sm font-medium text-ink">
          Type <strong>DELETE</strong> to confirm:
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className={inputClass}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStep("warning")}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink"
          >
            Back
          </button>
          <button
            type="button"
            disabled={confirmText !== "DELETE"}
            onClick={() => setStep("verify")}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Delete account">
      <p className="text-sm text-muted">
        {totpEnabled
          ? "Enter the 6-digit code from your authenticator app (or a backup code)."
          : "Enter your current password to confirm your identity."}
      </p>
      <label className="mt-4 block text-sm font-medium text-ink">
        {totpEnabled ? "Authenticator code" : "Password"}
        <input
          type={totpEnabled ? "text" : "password"}
          value={totpEnabled ? totpToken : password}
          onChange={(e) =>
            totpEnabled ? setTotpToken(e.target.value) : setPassword(e.target.value)
          }
          className={inputClass}
          autoComplete={totpEnabled ? "one-time-code" : "current-password"}
        />
      </label>
      <button
        type="button"
        disabled={
          busy ||
          (totpEnabled ? !totpToken.trim() : !password.trim())
        }
        onClick={() => void deleteAccount()}
        className="mt-4 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
      >
        {busy ? "Deleting…" : "Permanently delete my account"}
      </button>
    </Panel>
  );
}
