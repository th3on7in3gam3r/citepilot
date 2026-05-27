"use client";

import Link from "next/link";
import { useState } from "react";
import { UpgradePrompt } from "@/components/billing/UpgradePrompt";
import { trackEvent } from "@/lib/analytics/track";

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
  /** One free explain-gap on Free after first audit */
  freeTeaser?: boolean;
  onTeaserUsed?: () => void;
};

export function CopilotInsight({
  kind,
  workspaceId,
  gap,
  requiresAudit = true,
  buttonLabel,
  compact = false,
  freeTeaser = false,
  onTeaserUsed,
}: CopilotInsightProps) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const [usedTeaser, setUsedTeaser] = useState(false);

  const defaultLabel =
    kind === "prioritize"
      ? "Prioritize with CitePilot"
      : freeTeaser
        ? "Explain once (free preview)"
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
        teaser?: boolean;
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
      if (data.teaser) {
        setUsedTeaser(true);
        onTeaserUsed?.();
      }
      trackEvent("insights_completed", {
        workspaceId,
        kind,
        teaser: data.teaser ?? false,
        source: kind === "prioritize" ? "overview" : "geo_audit",
      });
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
            {freeTeaser ? " · free preview" : ""}
          </p>
          <div className="whitespace-pre-wrap">{text}</div>
          {usedTeaser && (
            <p className="mt-3 border-t border-accent/10 pt-3 text-xs text-muted">
              That was your one free explanation on this workspace. Upgrade to
              Pilot for unlimited Insights and weekly rescans.
            </p>
          )}
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
