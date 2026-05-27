"use client";

import Link from "next/link";
import { useState } from "react";
import { UpgradePrompt } from "@/components/billing/UpgradePrompt";

type CopilotKind = "prioritize" | "explain-gap";

type CopilotInsightProps = {
  kind: CopilotKind;
  workspaceId: string;
  /** Required when kind is explain-gap */
  gap?: string;
  /** Shown when audit data is missing */
  requiresAudit?: boolean;
  buttonLabel?: string;
  compact?: boolean;
};

export function CopilotInsight({
  kind,
  workspaceId,
  gap,
  requiresAudit = true,
  buttonLabel,
  compact = false,
}: CopilotInsightProps) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);

  const defaultLabel =
    kind === "prioritize"
      ? "Prioritize with CitePilot"
      : "Explain with CitePilot";

  async function run() {
    if (requiresAudit) return;
    setLoading(true);
    setError(null);
    setNeedsUpgrade(false);
    setText(null);

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          kind,
          workspaceId,
          ...(kind === "explain-gap" && gap ? { gap } : {}),
        }),
      });
      const data = (await res.json()) as {
        text?: string;
        error?: string;
        code?: string;
      };

      if (res.status === 402 || data.code === "PILOT_REQUIRED") {
        setNeedsUpgrade(true);
        return;
      }

      if (!res.ok) {
        setError(data.error ?? "Could not generate insight.");
        return;
      }

      setText(data.text ?? "");
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  if (requiresAudit) {
    return (
      <p className="text-xs text-muted">
        Run a citation audit to unlock CitePilot Insights for this workspace.
      </p>
    );
  }

  return (
    <div className={compact ? "mt-2" : "mt-3"}>
      <button
        type="button"
        onClick={() => void run()}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/5 font-semibold text-accent transition hover:bg-accent/10 disabled:opacity-60 ${
          compact
            ? "px-3 py-1 text-[11px]"
            : "px-4 py-2 text-xs"
        }`}
      >
        {loading ? "Thinking…" : (buttonLabel ?? defaultLabel)}
        {!loading && <span aria-hidden>✦</span>}
      </button>

      {needsUpgrade && (
        <div className="mt-3">
          <UpgradePrompt
            compact
            title="CitePilot Insights (Pilot+)"
            description="Grounded explanations and weekly prioritization from your audit data — included on Pilot and Fleet."
          />
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}

      {text && (
        <div
          className={`mt-3 rounded-xl border border-accent/20 bg-gradient-to-br from-accent/5 to-white text-sm leading-relaxed text-ink ${
            compact ? "px-3 py-3" : "px-4 py-4"
          }`}
        >
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-accent">
            CitePilot Insights
          </p>
          <div className="whitespace-pre-wrap">{text}</div>
          {kind === "prioritize" && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-accent/10 pt-3">
              <Link
                href="/dashboard/geo-audit"
                className="text-xs font-semibold text-accent hover:underline"
              >
                GEO Audit →
              </Link>
              <Link
                href="/dashboard/content"
                className="text-xs font-semibold text-accent hover:underline"
              >
                Content →
              </Link>
              <Link
                href="/dashboard/discussions"
                className="text-xs font-semibold text-accent hover:underline"
              >
                Discussions →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
