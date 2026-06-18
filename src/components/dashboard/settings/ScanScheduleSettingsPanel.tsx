"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DashboardPageHeader, Panel } from "@/components/dashboard/DashboardUI";
import { SettingsToggleRow } from "@/components/dashboard/SettingsToggleRow";
import { useToast } from "@/components/notifications/ToastProvider";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { ScanHistorySection } from "@/components/dashboard/scans/ScanHistoryPanel";
import type {
  ScanScheduleFrequency,
  ScanScheduleHour,
  ScanSchedulePreferences,
} from "@/lib/settings";

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const HOURS: { value: ScanScheduleHour; label: string }[] = [
  { value: 6, label: "6:00 AM" },
  { value: 8, label: "8:00 AM" },
  { value: 10, label: "10:00 AM" },
  { value: 12, label: "12:00 PM" },
];

const FREQUENCIES: { value: ScanScheduleFrequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
];

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

export function ScanScheduleSettingsPanel() {
  const toast = useToast();
  const { workspace, ready } = useWorkspaceContext();
  const workspaceId = workspace?.workspaceId ?? workspace?.id ?? "";

  const [schedule, setSchedule] = useState<ScanSchedulePreferences>({
    frequency: "weekly",
    dayOfWeek: 1,
    hour: 8,
    timezone: "UTC",
  });
  const [paused, setPaused] = useState(false);
  const [nextScanLabel, setNextScanLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPilot, setIsPilot] = useState(false);

  const detectTimezone = useCallback(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }, []);

  useEffect(() => {
    void fetch("/api/billing/status", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { plan?: string } | null) =>
        setIsPilot(d?.plan === "pilot" || d?.plan === "fleet"),
      )
      .catch(() => setIsPilot(false));
  }, []);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    void fetch(`/api/workspaces/${workspaceId}/schedule`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (d: {
          schedule?: ScanSchedulePreferences;
          nextScanLabel?: string;
          paused?: boolean;
        } | null) => {
          if (d?.schedule) {
            setSchedule({
              ...d.schedule,
              timezone: d.schedule.timezone || detectTimezone(),
            });
          } else {
            setSchedule((s) => ({ ...s, timezone: detectTimezone() }));
          }
          setNextScanLabel(d?.nextScanLabel ?? null);
          setPaused(Boolean(d?.paused));
        },
      )
      .finally(() => setLoading(false));
  }, [workspaceId, detectTimezone]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/schedule`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...schedule, paused }),
      });
      const body = (await res.json()) as {
        error?: string;
        nextScanLabel?: string;
        paused?: boolean;
      };
      if (!res.ok) {
        toast.error(body.error ?? "Failed to save schedule");
        return;
      }
      setNextScanLabel(body.nextScanLabel ?? null);
      setPaused(Boolean(body.paused));
      toast.success("Scan schedule saved");
    } catch {
      toast.error("Failed to save schedule");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 w-48 rounded-lg bg-surface" />
        <div className="h-64 rounded-2xl bg-surface" />
      </div>
    );
  }

  if (!workspaceId) {
    return (
      <p className="text-sm text-muted">
        Create a workspace first, then configure automatic scans.
      </p>
    );
  }

  if (!isPilot) {
    return (
      <Panel title="Scan schedule">
        <p className="text-sm text-muted">
          Automatic scheduled scans are available on Pilot and Fleet plans.
        </p>
        <Link
          href="/dashboard/settings#plan"
          className="mt-4 inline-block text-sm font-semibold text-accent hover:underline"
        >
          Upgrade plan →
        </Link>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Scan schedule"
        description="Configure automatic citation rescans for this workspace. Scheduled scans respect your timezone and skip paused workspaces."
      />

      <Panel title="Pause monitoring">
        <SettingsToggleRow
          id="pause-monitoring"
          label="Pause monitoring"
          hint="Stop scheduled scans while keeping historical data. Manual rescans are also blocked while paused."
          checked={paused}
          onCheckedChange={setPaused}
        />
        {paused && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Monitoring paused — no scheduled scans will run until you resume.
          </p>
        )}
      </Panel>

      <Panel title="Automatic scan schedule">
        {loading ? (
          <p className="text-sm text-muted">Loading schedule…</p>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-semibold text-ink">Frequency</span>
                <select
                  className={inputClass}
                  value={schedule.frequency}
                  onChange={(e) =>
                    setSchedule((s) => ({
                      ...s,
                      frequency: e.target.value as ScanScheduleFrequency,
                    }))
                  }
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className="font-semibold text-ink">Day</span>
                <select
                  className={inputClass}
                  value={schedule.dayOfWeek}
                  onChange={(e) =>
                    setSchedule((s) => ({
                      ...s,
                      dayOfWeek: Number(e.target.value),
                    }))
                  }
                >
                  {DAYS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className="font-semibold text-ink">Time</span>
                <select
                  className={inputClass}
                  value={schedule.hour}
                  onChange={(e) =>
                    setSchedule((s) => ({
                      ...s,
                      hour: Number(e.target.value) as ScanScheduleHour,
                    }))
                  }
                >
                  {HOURS.map((h) => (
                    <option key={h.value} value={h.value}>
                      {h.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className="font-semibold text-ink">Timezone</span>
                <input
                  className={inputClass}
                  value={schedule.timezone}
                  onChange={(e) =>
                    setSchedule((s) => ({ ...s, timezone: e.target.value }))
                  }
                  list="timezone-suggestions"
                  placeholder="America/New_York"
                />
                <datalist id="timezone-suggestions">
                  <option value={detectTimezone()} />
                  <option value="UTC" />
                  <option value="America/New_York" />
                  <option value="America/Chicago" />
                  <option value="America/Denver" />
                  <option value="America/Los_Angeles" />
                  <option value="Europe/London" />
                </datalist>
              </label>
            </div>

            {nextScanLabel && !paused && (
              <p className="rounded-xl border border-mint/30 bg-mint/5 px-4 py-3 text-sm text-ink">
                Next scan: <strong>{nextScanLabel}</strong>
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink/90 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save schedule"}
            </button>
          </form>
        )}
      </Panel>

      <ScanHistorySection workspaceId={workspaceId} />
    </div>
  );
}
