"use client";

import { FeatureGate } from "@/components/billing/FeatureGate";
import { SettingsToggleRow } from "@/components/dashboard/SettingsToggleRow";
import { Panel } from "@/components/dashboard/DashboardUI";
import { useBilling } from "@/contexts/BillingContext";
import type { ScoreDropThresholdPercent, WorkspacePreferences } from "@/lib/settings";

const ALERT_ITEMS = [
  {
    key: "weeklyDigest" as const,
    label: "Weekly digest email",
    hint: "Summary of score changes and top gaps",
  },
  {
    key: "auditCompleteEmail" as const,
    label: "Audit complete alerts",
    hint: "Notify when a re-scan finishes",
  },
  {
    key: "scoreDropAlerts" as const,
    label: "Citation score drop alerts",
    hint: "Email when citation rate falls beyond your threshold",
  },
  {
    key: "competitorMoveAlerts" as const,
    label: "Competitor citation alerts",
    hint: "Email when a competitor gains a new citation on your prompts",
  },
  {
    key: "proofReportEmail" as const,
    label: "Weekly proof report email",
    hint: "After re-scan: score delta, proof report link, and client share URL",
  },
  {
    key: "discussionAlerts" as const,
    label: "Discussion opportunity alerts",
    hint: "HN & Stack Overflow threads in your niche",
  },
] as const;

const DIGEST_DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const THRESHOLDS: ScoreDropThresholdPercent[] = [5, 10, 20];

type EmailAlertsSettingsPanelProps = {
  preferences: WorkspacePreferences;
  togglesBusy: boolean;
  onPreferenceChange: (next: WorkspacePreferences) => void;
  testDigestButton?: React.ReactNode;
  embedded?: boolean;
};

export function EmailAlertsSettingsPanel({
  preferences,
  togglesBusy,
  onPreferenceChange,
  testDigestButton,
  embedded = false,
}: EmailAlertsSettingsPanelProps) {
  const { isPaid, ready } = useBilling();

  if (!ready) {
    const skeleton = <div className="h-32 animate-pulse rounded-xl bg-surface" />;
    return embedded ? skeleton : <Panel title="Email alerts">{skeleton}</Panel>;
  }

  const body = !isPaid ? (
    <FeatureGate
      feature="email_alerts"
      title="Email alerts & monitoring digests"
      description="Get notified when citations move, scores drop, or competitors gain ground — plus weekly proof reports for clients."
      cta="Upgrade to Pilot →"
      highlights={[
        "Weekly citation digest",
        "Competitor move alerts",
        "Monday proof report emails",
      ]}
    />
  ) : (
    <>
      {testDigestButton}
      <div className={`space-y-4 ${testDigestButton ? "mt-4" : ""}`}>
        <div className="rounded-xl border border-border bg-card/60 px-4 py-3">
          <label className="block text-sm font-semibold text-ink">
            Alert me when citation rate drops by more than
            <select
              value={preferences.scoreDropThresholdPercent}
              disabled={togglesBusy || !preferences.scoreDropAlerts}
              onChange={(e) =>
                onPreferenceChange({
                  ...preferences,
                  scoreDropThresholdPercent: Number(
                    e.target.value,
                  ) as ScoreDropThresholdPercent,
                })
              }
              className="ml-2 mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-normal text-ink sm:mt-0 sm:inline-block sm:w-auto"
            >
              {THRESHOLDS.map((t) => (
                <option key={t} value={t}>
                  {t}%
                </option>
              ))}
            </select>
          </label>
        </div>

        <ul className="space-y-3">
          {ALERT_ITEMS.map((item) => (
            <li key={item.key}>
              <SettingsToggleRow
                id={`settings-${item.key}`}
                label={item.label}
                hint={item.hint}
                checked={preferences[item.key]}
                disabled={togglesBusy}
                onCheckedChange={(enabled) => {
                  onPreferenceChange({
                    ...preferences,
                    [item.key]: enabled,
                  });
                }}
              />
              {item.key === "weeklyDigest" && preferences.weeklyDigest && (
                <label className="mt-2 block pl-1 text-sm text-muted">
                  Send on
                  <select
                    value={preferences.weeklyDigestDay}
                    disabled={togglesBusy}
                    onChange={(e) =>
                      onPreferenceChange({
                        ...preferences,
                        weeklyDigestDay: Number(e.target.value),
                      })
                    }
                    className="ml-2 rounded-lg border border-border bg-surface px-2 py-1 text-sm text-ink"
                  >
                    {DIGEST_DAYS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  <span className="ml-1 text-xs">(UTC)</span>
                </label>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );

  if (embedded) {
    return <div className="mt-4">{body}</div>;
  }

  return <Panel title="Email alerts">{body}</Panel>;
}
