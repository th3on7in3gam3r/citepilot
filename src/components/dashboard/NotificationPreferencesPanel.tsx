"use client";

import { useCallback, useEffect, useState } from "react";
import { FeatureGate } from "@/components/billing/FeatureGate";
import { SettingsToggleRow } from "@/components/dashboard/SettingsToggleRow";
import { SlackAlertsPanel } from "@/components/dashboard/SlackAlertsPanel";
import { useBilling } from "@/contexts/BillingContext";
import { useToast } from "@/components/notifications/ToastProvider";
import type {
  NotificationPreferences,
  WebhookEventType,
} from "@/lib/notifications/preferences-types";
import { WEBHOOK_EVENT_OPTIONS } from "@/lib/notifications/preferences-types";
import type { ScoreDropThresholdPercent } from "@/lib/settings";

const DIGEST_DAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
];

const DIGEST_HOURS = [
  { value: 8, label: "8am" },
  { value: 9, label: "9am" },
  { value: 12, label: "12pm" },
];

const THRESHOLDS: ScoreDropThresholdPercent[] = [5, 10, 20];

const WEBHOOK_EVENT_LABELS: Record<WebhookEventType, string> = {
  "audit.completed": "audit.completed",
  "citation.change_detected": "citation.change_detected",
  "prompt.limit_reached": "prompt.limit_reached",
};

type WebhookRow = {
  id: string;
  url: string;
  createdAt: string;
};

type SlackMeta = {
  connected: boolean;
  teamName: string | null;
  channelId: string | null;
  channelName: string | null;
};

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-normal text-ink";

function SaveSectionFooter({
  saving,
  saved,
  onSave,
}: {
  saving: boolean;
  saved: boolean;
  onSave: () => void;
}) {
  return (
    <div className="mt-4 flex items-center gap-3">
      <button
        type="button"
        disabled={saving}
        onClick={onSave}
        className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-ink hover:bg-surface disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
      {saved && (
        <span className="text-xs font-semibold text-mint" aria-live="polite">
          Saved ✓
        </span>
      )}
    </div>
  );
}

export function NotificationPreferencesPanel({
  workspaceId,
  onMonitoringEmailSaved,
}: {
  workspaceId: string;
  onMonitoringEmailSaved?: (email: string) => void;
}) {
  const { isPaid, isFleet, ready } = useBilling();
  const toast = useToast();
  const userTimezone =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC";

  const [loading, setLoading] = useState(true);
  const [emailPrefs, setEmailPrefs] = useState<NotificationPreferences | null>(
    null,
  );
  const [slackPrefs, setSlackPrefs] = useState<NotificationPreferences | null>(
    null,
  );
  const [webhookPrefs, setWebhookPrefs] = useState<NotificationPreferences | null>(
    null,
  );
  const [monitoringEmail, setMonitoringEmail] = useState("");
  const [slackMeta, setSlackMeta] = useState<SlackMeta>({
    connected: false,
    teamName: null,
    channelId: null,
    channelName: null,
  });

  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);
  const [slackSaving, setSlackSaving] = useState(false);
  const [slackSaved, setSlackSaved] = useState(false);
  const [webhookSaving, setWebhookSaving] = useState(false);
  const [webhookSaved, setWebhookSaved] = useState(false);

  const [testDigestSending, setTestDigestSending] = useState(false);
  const [testSlackSending, setTestSlackSending] = useState(false);

  const [webhooks, setWebhooks] = useState<WebhookRow[]>([]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [webhookFormOpen, setWebhookFormOpen] = useState(false);
  const [webhookAdding, setWebhookAdding] = useState(false);
  const [webhookTesting, setWebhookTesting] = useState(false);
  const [showChannelPicker, setShowChannelPicker] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/notifications/preferences?workspaceId=${encodeURIComponent(workspaceId)}`,
        { credentials: "include" },
      );
      const data = (await res.json()) as {
        preferences?: NotificationPreferences;
        monitoringEmail?: string;
        slack?: SlackMeta;
        error?: string;
      };
      if (!res.ok) {
        toast.error(data.error ?? "Failed to load notification preferences");
        return;
      }
      const prefs = data.preferences!;
      setEmailPrefs({ ...prefs, digestTimezone: userTimezone });
      setSlackPrefs({ ...prefs });
      setWebhookPrefs({ ...prefs });
      setMonitoringEmail(data.monitoringEmail ?? "");
      setSlackMeta(
        data.slack ?? {
          connected: false,
          teamName: null,
          channelId: null,
          channelName: null,
        },
      );
    } finally {
      setLoading(false);
    }
  }, [workspaceId, toast, userTimezone]);

  const loadWebhooks = useCallback(async () => {
    if (!isFleet) return;
    const res = await fetch(
      `/api/integrations/webhooks?workspaceId=${encodeURIComponent(workspaceId)}`,
      { credentials: "include" },
    );
    const data = (await res.json()) as { endpoints?: WebhookRow[] };
    if (res.ok) setWebhooks(data.endpoints ?? []);
  }, [workspaceId, isFleet]);

  useEffect(() => {
    if (ready && isPaid) void load();
  }, [ready, isPaid, load]);

  useEffect(() => {
    if (ready && isFleet) void loadWebhooks();
  }, [ready, isFleet, loadWebhooks]);

  async function saveSection(
    section: "email" | "slack" | "webhooks",
    body: Record<string, unknown>,
    rollback: () => void,
  ): Promise<boolean> {
    const setSaving =
      section === "email"
        ? setEmailSaving
        : section === "slack"
          ? setSlackSaving
          : setWebhookSaving;
    const setSaved =
      section === "email"
        ? setEmailSaved
        : section === "slack"
          ? setSlackSaved
          : setWebhookSaved;

    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, section, ...body }),
      });
      const data = (await res.json()) as {
        preferences?: NotificationPreferences;
        error?: string;
      };
      if (!res.ok) {
        rollback();
        toast.error(data.error ?? "Failed to save preferences");
        return false;
      }
      if (data.preferences) {
        if (section === "email") {
          setEmailPrefs(data.preferences);
          setSlackPrefs((prev) => ({ ...prev!, ...data.preferences! }));
          setWebhookPrefs((prev) => ({ ...prev!, ...data.preferences! }));
        } else if (section === "slack") {
          setSlackPrefs(data.preferences);
        } else {
          setWebhookPrefs(data.preferences);
        }
      }
      if (section === "email" && typeof body.monitoringEmail === "string") {
        onMonitoringEmailSaved?.(body.monitoringEmail);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return true;
    } catch {
      rollback();
      toast.error("Network error — could not save preferences");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveEmail() {
    if (!emailPrefs) return;
    const snapshot = { ...emailPrefs };
    const emailSnapshot = monitoringEmail;
    await saveSection(
      "email",
      {
        emailWeeklyDigest: emailPrefs.emailWeeklyDigest,
        digestDay: emailPrefs.digestDay,
        digestHour: emailPrefs.digestHour,
        digestTimezone: userTimezone,
        emailDropAlerts: emailPrefs.emailDropAlerts,
        dropThreshold: emailPrefs.dropThreshold,
        emailCompetitorAlerts: emailPrefs.emailCompetitorAlerts,
        monitoringEmail,
      },
      () => {
        setEmailPrefs(snapshot);
        setMonitoringEmail(emailSnapshot);
      },
    );
  }

  async function saveSlack() {
    if (!slackPrefs) return;
    const snapshot = { ...slackPrefs };
    await saveSection(
      "slack",
      {
        slackWeekly: slackPrefs.slackWeekly,
        slackDropAlerts: slackPrefs.slackDropAlerts,
      },
      () => setSlackPrefs(snapshot),
    );
  }

  async function saveWebhooks() {
    if (!webhookPrefs) return;
    const snapshot = { ...webhookPrefs };
    await saveSection(
      "webhooks",
      { webhookEvents: webhookPrefs.webhookEvents },
      () => setWebhookPrefs(snapshot),
    );
  }

  async function sendTestDigest() {
    setTestDigestSending(true);
    try {
      const res = await fetch("/api/notifications/test-digest", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "weekly_digest", workspaceId }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        hint?: string;
        warning?: string;
      };
      if (res.ok && data.ok !== false) {
        toast.success("Test digest sent — check your inbox", {
          description: data.warning,
        });
      } else {
        toast.error(data.error ?? `Failed to send test digest (${res.status})`, {
          description: data.hint,
        });
      }
    } catch {
      toast.error("Network error — could not send test digest");
    } finally {
      setTestDigestSending(false);
    }
  }

  async function sendTestSlack() {
    setTestSlackSending(true);
    try {
      const res = await fetch("/api/notifications/test-slack", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        toast.success("Test Slack message sent");
      } else {
        toast.error(data.error ?? "Failed to send test Slack message");
      }
    } catch {
      toast.error("Network error — could not send test Slack message");
    } finally {
      setTestSlackSending(false);
    }
  }

  async function addWebhook() {
    if (!webhookUrl.trim() || !webhookSecret.trim()) return;
    setWebhookAdding(true);
    try {
      const res = await fetch("/api/integrations/webhooks", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          url: webhookUrl.trim(),
          secret: webhookSecret.trim(),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Failed to add webhook");
        return;
      }
      setWebhookUrl("");
      setWebhookSecret("");
      setWebhookFormOpen(false);
      toast.success("Webhook endpoint added");
      await loadWebhooks();
    } finally {
      setWebhookAdding(false);
    }
  }

  async function revokeWebhook(id: string) {
    const res = await fetch(
      `/api/integrations/webhooks?workspaceId=${encodeURIComponent(workspaceId)}&id=${encodeURIComponent(id)}`,
      { method: "DELETE", credentials: "include" },
    );
    if (!res.ok) {
      toast.error("Failed to revoke webhook");
      return;
    }
    toast.success("Webhook revoked");
    await loadWebhooks();
  }

  async function sendTestWebhook() {
    setWebhookTesting(true);
    try {
      const first = webhooks[0];
      const res = await fetch("/api/integrations/webhooks/test", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          first
            ? { workspaceId, endpointId: first.id }
            : {
                workspaceId,
                url: webhookUrl.trim(),
                secret: webhookSecret.trim(),
              },
        ),
      });
      const data = (await res.json()) as { error?: string; status?: number };
      if (!res.ok) {
        toast.error(data.error ?? "Test webhook delivery failed");
        return;
      }
      toast.success("Test webhook delivered", {
        description: data.status ? `HTTP ${data.status}` : undefined,
      });
    } finally {
      setWebhookTesting(false);
    }
  }

  if (!ready || loading) {
    return <div className="h-48 animate-pulse rounded-xl bg-surface" />;
  }

  if (!isPaid) {
    return (
      <FeatureGate
        feature="email_alerts"
        title="Notification preferences"
        description="Control when and how CitePilot sends citation alerts — email, Slack, and webhooks."
        cta="Upgrade to Pilot →"
        highlights={[
          "Weekly citation digest",
          "Citation drop & competitor alerts",
          "Slack and webhook delivery (Fleet)",
        ]}
      />
    );
  }

  if (!emailPrefs || !slackPrefs || !webhookPrefs) {
    return (
      <p className="text-sm text-muted">
        Could not load notification preferences. Refresh and try again.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {/* A. Email Alerts */}
      <section>
        <h3 className="text-sm font-semibold text-ink">Email alerts</h3>
        <p className="mt-1 text-xs text-muted">
          Choose when CitePilot emails you about citation changes.
        </p>

        <label className="mt-4 block text-sm font-semibold text-ink">
          Monitoring email
          <input
            type="email"
            value={monitoringEmail}
            onChange={(e) => setMonitoringEmail(e.target.value)}
            placeholder="you@company.com"
            className={inputClass}
          />
        </label>

        <ul className="mt-4 space-y-3">
          <SettingsToggleRow
            id="notif-weekly-digest"
            label="Weekly citation digest"
            hint="Summary of score changes and top gaps"
            checked={emailPrefs.emailWeeklyDigest}
            onCheckedChange={(enabled) =>
              setEmailPrefs((p) => (p ? { ...p, emailWeeklyDigest: enabled } : p))
            }
          />
          {emailPrefs.emailWeeklyDigest && (
            <li className="rounded-xl bg-surface/60 px-4 py-2">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                <span>Send on</span>
                <select
                  value={emailPrefs.digestDay}
                  onChange={(e) =>
                    setEmailPrefs((p) =>
                      p ? { ...p, digestDay: Number(e.target.value) } : p,
                    )
                  }
                  className="rounded-lg border border-border bg-surface px-2 py-1 text-sm text-ink"
                >
                  {DIGEST_DAYS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <span>at</span>
                <select
                  value={emailPrefs.digestHour}
                  onChange={(e) =>
                    setEmailPrefs((p) =>
                      p ? { ...p, digestHour: Number(e.target.value) } : p,
                    )
                  }
                  className="rounded-lg border border-border bg-surface px-2 py-1 text-sm text-ink"
                >
                  {DIGEST_HOURS.map((h) => (
                    <option key={h.value} value={h.value}>
                      {h.label}
                    </option>
                  ))}
                </select>
                <span className="text-xs">({userTimezone})</span>
              </div>
            </li>
          )}

          <SettingsToggleRow
            id="notif-drop-alerts"
            label="Citation drop alerts"
            hint="Email when citation rate falls beyond your threshold"
            checked={emailPrefs.emailDropAlerts}
            onCheckedChange={(enabled) =>
              setEmailPrefs((p) => (p ? { ...p, emailDropAlerts: enabled } : p))
            }
          />
          {emailPrefs.emailDropAlerts && (
            <li className="rounded-xl bg-surface/60 px-4 py-2">
              <label className="block text-sm text-muted">
                When rate drops by more than
                <select
                  value={emailPrefs.dropThreshold}
                  disabled={!emailPrefs.emailDropAlerts}
                  onChange={(e) =>
                    setEmailPrefs((p) =>
                      p
                        ? {
                            ...p,
                            dropThreshold: Number(
                              e.target.value,
                            ) as ScoreDropThresholdPercent,
                          }
                        : p,
                    )
                  }
                  className="ml-2 rounded-lg border border-border bg-surface px-2 py-1 text-sm text-ink"
                >
                  {THRESHOLDS.map((t) => (
                    <option key={t} value={t}>
                      {t}%
                    </option>
                  ))}
                </select>
              </label>
            </li>
          )}

          <SettingsToggleRow
            id="notif-competitor-alerts"
            label="Competitor gain alerts"
            hint="Alert when a competitor gains a citation on your tracked prompts"
            checked={emailPrefs.emailCompetitorAlerts}
            onCheckedChange={(enabled) =>
              setEmailPrefs((p) =>
                p ? { ...p, emailCompetitorAlerts: enabled } : p,
              )
            }
          />
        </ul>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={testDigestSending}
            onClick={() => void sendTestDigest()}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-ink hover:bg-slate-100 disabled:opacity-50"
          >
            {testDigestSending ? "Sending…" : "Send test digest →"}
          </button>
        </div>

        <SaveSectionFooter
          saving={emailSaving}
          saved={emailSaved}
          onSave={() => void saveEmail()}
        />
      </section>

      {/* B. Slack */}
      {slackMeta.connected && (
        <section className="rounded-xl border border-border bg-surface/50 p-4">
          <h3 className="text-sm font-semibold text-ink">Slack</h3>
          <p className="mt-1 text-xs text-muted">
            Mirror email alerts to your connected Slack workspace.
          </p>

          <ul className="mt-4 space-y-3">
            <SettingsToggleRow
              id="notif-slack-weekly"
              label="Post weekly digest to Slack"
              hint="Block Kit summary on your chosen schedule"
              checked={slackPrefs.slackWeekly}
              onCheckedChange={(enabled) =>
                setSlackPrefs((p) => (p ? { ...p, slackWeekly: enabled } : p))
              }
            />
            <SettingsToggleRow
              id="notif-slack-drop"
              label="Post citation drop alerts to Slack"
              hint="Real-time posts when citation rate falls"
              checked={slackPrefs.slackDropAlerts}
              onCheckedChange={(enabled) =>
                setSlackPrefs((p) => (p ? { ...p, slackDropAlerts: enabled } : p))
              }
            />
          </ul>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-ink">
            <span>
              #{slackMeta.channelName ?? "channel"}{" "}
              <span className="text-xs text-muted">(connected)</span>
            </span>
            <button
              type="button"
              onClick={() => setShowChannelPicker((v) => !v)}
              className="text-xs font-semibold text-accent hover:underline"
            >
              Change channel
            </button>
          </div>

          {showChannelPicker && (
            <div className="mt-3">
              <SlackAlertsPanel workspaceId={workspaceId} />
            </div>
          )}

          <div className="mt-4">
            <button
              type="button"
              disabled={testSlackSending}
              onClick={() => void sendTestSlack()}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-ink hover:bg-slate-100 disabled:opacity-50"
            >
              {testSlackSending ? "Sending…" : "Send test Slack message →"}
            </button>
          </div>

          <SaveSectionFooter
            saving={slackSaving}
            saved={slackSaved}
            onSave={() => void saveSlack()}
          />
        </section>
      )}

      {!slackMeta.connected && (
        <section className="rounded-xl border border-border bg-surface/50 p-4">
          <h3 className="text-sm font-semibold text-ink">Slack</h3>
          <p className="mt-1 text-xs text-muted">
            Connect Slack to post digests and citation alerts to a channel.
          </p>
          <div className="mt-3">
            <SlackAlertsPanel workspaceId={workspaceId} />
          </div>
        </section>
      )}

      {/* C. Webhooks (Fleet) */}
      <section className="rounded-xl border border-border bg-surface/50 p-4">
        <h3 className="text-sm font-semibold text-ink">Webhooks</h3>
        {!isFleet ? (
          <p className="mt-2 text-xs text-muted">
            Fleet plan — push signed JSON events to your stack.
          </p>
        ) : (
          <>
            <p className="mt-1 text-xs text-muted">
              Receive HMAC-signed flat JSON payloads for Zapier, Make.com, and custom endpoints.{" "}
              <a href="/docs/integrations" className="font-semibold text-accent hover:underline">
                Integration guide →
              </a>
            </p>

            {webhooks.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {webhooks.map((ep) => (
                  <li
                    key={ep.id}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-card px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <code className="block truncate text-xs text-ink">
                        {ep.url}
                      </code>
                      <p className="mt-1 text-xs text-muted">
                        Added{" "}
                        {new Date(ep.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void revokeWebhook(ep.id)}
                      className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Revoke
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-muted">No webhook endpoints yet.</p>
            )}

            {webhookFormOpen ? (
              <div className="mt-4 space-y-3 rounded-lg border border-border bg-card p-4">
                <label className="block text-sm font-semibold text-ink">
                  URL
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://hooks.example.com/citepilot"
                    className={inputClass}
                  />
                </label>
                <label className="block text-sm font-semibold text-ink">
                  Secret
                  <input
                    type="password"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    placeholder="whsec_…"
                    className={inputClass}
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={webhookAdding || !webhookUrl.trim() || !webhookSecret.trim()}
                    onClick={() => void addWebhook()}
                    className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-ink hover:bg-surface disabled:opacity-50"
                  >
                    {webhookAdding ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setWebhookFormOpen(false)}
                    className="rounded-full px-4 py-2 text-xs font-semibold text-muted hover:text-ink"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setWebhookFormOpen(true)}
                className="mt-4 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-ink hover:bg-surface"
              >
                Add webhook endpoint
              </button>
            )}

            <fieldset className="mt-5">
              <legend className="text-sm font-semibold text-ink">
                Events to receive
              </legend>
              <ul className="mt-2 space-y-2">
                {WEBHOOK_EVENT_OPTIONS.map((event) => (
                  <li key={event}>
                    <label className="flex items-center gap-2 text-sm text-ink">
                      <input
                        type="checkbox"
                        checked={webhookPrefs.webhookEvents.includes(event)}
                        onChange={(e) => {
                          setWebhookPrefs((p) => {
                            if (!p) return p;
                            const next = e.target.checked
                              ? [...p.webhookEvents, event]
                              : p.webhookEvents.filter((ev) => ev !== event);
                            return { ...p, webhookEvents: next };
                          });
                        }}
                        className="rounded border-border"
                      />
                      {WEBHOOK_EVENT_LABELS[event]}
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>

            <div className="mt-4">
              <button
                type="button"
                disabled={
                  webhookTesting ||
                  (webhooks.length === 0 &&
                    (!webhookUrl.trim() || !webhookSecret.trim()))
                }
                onClick={() => void sendTestWebhook()}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-ink hover:bg-slate-100 disabled:opacity-50"
              >
                {webhookTesting ? "Sending…" : "Send test webhook →"}
              </button>
            </div>

            <SaveSectionFooter
              saving={webhookSaving}
              saved={webhookSaved}
              onSave={() => void saveWebhooks()}
            />
          </>
        )}
      </section>
    </div>
  );
}
