"use client";

import { FeatureGate } from "@/components/billing/FeatureGate";
import { SettingsToggleRow } from "@/components/dashboard/SettingsToggleRow";
import { Panel } from "@/components/dashboard/DashboardUI";
import { useBilling } from "@/contexts/BillingContext";
import type { WorkspacePreferences } from "@/lib/settings";

const ALERT_ITEMS = [
  {
    key: "weeklyDigest" as const,
    label: "Weekly citation digest",
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
    hint: "Email when score falls 5+ points after a re-scan",
  },
  {
    key: "competitorMoveAlerts" as const,
    label: "Competitor move alerts",
    hint: "Email when prompts are lost, platforms slip, or competitor gaps appear",
  },
  {
    key: "proofReportEmail" as const,
    label: "Weekly proof report email",
    hint: "After Monday re-scan: score delta, proof report link, and client share URL",
  },
  {
    key: "discussionAlerts" as const,
    label: "Discussion opportunity alerts",
    hint: "HN & Stack Overflow threads in your niche",
  },
] as const;

type EmailAlertsSettingsPanelProps = {
  preferences: WorkspacePreferences;
  togglesBusy: boolean;
  onPreferenceChange: (next: WorkspacePreferences) => void;
  testDigestButton?: React.ReactNode;
  /** When true, render toggles/gate only (no outer Panel). */
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
      <ul className={`space-y-3 ${testDigestButton ? "mt-4" : ""}`}>
        {ALERT_ITEMS.map((item) => (
          <SettingsToggleRow
            key={item.key}
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
        ))}
      </ul>
    </>
  );

  if (embedded) {
    return <div className="mt-4">{body}</div>;
  }

  return <Panel title="Email alerts">{body}</Panel>;
}
