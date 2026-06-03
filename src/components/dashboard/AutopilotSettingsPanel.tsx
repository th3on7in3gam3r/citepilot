"use client";

import { useState } from "react";
import { UpgradePrompt } from "@/components/billing/UpgradePrompt";
import { Panel } from "@/components/dashboard/DashboardUI";
import { SettingsToggleRow } from "@/components/dashboard/SettingsToggleRow";
import { LiquidToggle } from "@/components/ui/liquid-toggle";
import type { WorkspacePreferences } from "@/lib/settings";
import { trackEvent } from "@/lib/analytics/track";

type AutopilotSettingsPanelProps = {
  workspaceId: string;
  preferences: WorkspacePreferences;
  isPilot: boolean;
  togglesBusy: boolean;
  onPreferencesChange: (
    next: WorkspacePreferences,
    toast?: string,
  ) => void | Promise<void>;
};

export function AutopilotSettingsPanel({
  workspaceId,
  preferences,
  isPilot,
  togglesBusy,
  onPreferencesChange,
}: AutopilotSettingsPanelProps) {
  const [running, setRunning] = useState(false);
  const [runAudit, setRunAudit] = useState(false);
  const [runMessage, setRunMessage] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const ap = preferences.autopilot;

  function patchAutopilot(
    patch: Partial<WorkspacePreferences["autopilot"]>,
    toast?: string,
  ) {
    const next: WorkspacePreferences = {
      ...preferences,
      autopilot: { ...ap, ...patch },
    };
    void onPreferencesChange(next, toast);
  }

  async function runNow() {
    setRunning(true);
    setRunMessage(null);
    setRunError(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/autopilot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ runAudit }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        emailSent?: boolean;
        insightGenerated?: boolean;
      };

      if (res.status === 402) {
        setRunError(data.error ?? "Pilot required.");
        return;
      }
      if (!res.ok) {
        setRunError(data.error ?? "Autopilot failed.");
        return;
      }

      trackEvent("insights_completed", {
        workspaceId,
        kind: "prioritize",
        source: "autopilot_manual",
      });
      setRunMessage(
        data.emailSent
          ? "Autopilot finished — check your monitoring email."
          : data.insightGenerated
            ? "Autopilot finished — enable email report or set monitoring email to receive the plan."
            : "Autopilot finished.",
      );
    } catch {
      setRunError("Network error — try again.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <Panel title="CitePilot Autopilot">
      <p className="mb-4 text-sm text-muted">
        Your weekly citation co-pilot on Pilot+: re-scan monitored prompts, summarize
        what changed, generate a prioritized 7-day plan, and email a client-ready
        report. Never auto-publishes to CMS.
      </p>

      {!isPilot ? (
        <UpgradePrompt
          compact
          title="Autopilot (Pilot+)"
          description="Turn on weekly automated scans, Insights plans, and Autopilot emails for this workspace."
        />
      ) : (
        <>
          <ul className="space-y-3">
            <SettingsToggleRow
              id="autopilot-enabled"
              label="Enable Autopilot"
              hint="After each Monday re-scan, run Insights and optional email"
              checked={ap.enabled}
              disabled={togglesBusy}
              onCheckedChange={(enabled) =>
                patchAutopilot(
                  { enabled },
                  enabled ? "Autopilot enabled." : "Autopilot turned off.",
                )
              }
            />
            <SettingsToggleRow
              id="autopilot-email-report"
              label="Autopilot email report"
              hint="Delta summary, 7-day plan, proof report + share link"
              checked={ap.emailReport}
              disabled={togglesBusy || !ap.enabled}
              onCheckedChange={(emailReport) =>
                patchAutopilot({ emailReport }, "Autopilot email preference saved.")
              }
            />
            <SettingsToggleRow
              id="autopilot-auto-insights"
              label="Generate Insights plan"
              hint="Prioritized actions from your latest audit data"
              checked={ap.autoInsights}
              disabled={togglesBusy || !ap.enabled}
              onCheckedChange={(autoInsights) =>
                patchAutopilot({ autoInsights }, "Autopilot Insights preference saved.")
              }
            />
          </ul>

          <div className="mt-6 rounded-xl border border-accent/25 bg-accent/5 px-4 py-4">
            <p className="text-sm font-semibold text-ink">Run Autopilot now</p>
            <p className="mt-1 text-xs text-muted">
              Uses your latest audit, or run a fresh scan first. Limited to 5 runs per
              hour.
            </p>
            <label
              htmlFor="autopilot-run-audit-first"
              className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-white/60 px-3 py-2 text-xs text-muted"
            >
              <span>Run a new citation audit first</span>
              <LiquidToggle
                id="autopilot-run-audit-first"
                checked={runAudit}
                onCheckedChange={setRunAudit}
                aria-label="Run a new citation audit before Autopilot"
              />
            </label>
            <button
              type="button"
              disabled={running}
              onClick={() => void runNow()}
              className="mt-4 inline-flex rounded-full bg-gradient-to-r from-[#7b93f0] via-[#6b8cff] to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(107,140,255,0.3)] disabled:opacity-60"
            >
              {running ? "Running Autopilot…" : "Run Autopilot now"}
            </button>
            {runMessage && (
              <p className="mt-3 text-xs font-medium text-mint">{runMessage}</p>
            )}
            {runError && (
              <p className="mt-3 text-xs font-medium text-red-600" role="alert">
                {runError}
              </p>
            )}
          </div>
        </>
      )}
    </Panel>
  );
}
