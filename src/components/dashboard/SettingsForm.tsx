"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { BillingPlanPanel } from "@/components/billing/BillingPlanPanel";
import { AutopilotSettingsPanel } from "@/components/dashboard/AutopilotSettingsPanel";
import { EmailAlertsSettingsPanel } from "@/components/dashboard/EmailAlertsSettingsPanel";
import { SlackAlertsPanel } from "@/components/dashboard/SlackAlertsPanel";
import { WebhookAlertsPanel } from "@/components/dashboard/WebhookAlertsPanel";
import { SettingsToggleRow } from "@/components/dashboard/SettingsToggleRow";
import { GooeyFilter } from "@/components/ui/liquid-toggle";
import { FleetSettingsPanel } from "@/components/dashboard/FleetSettingsPanel";
import { ReferralPanel } from "@/components/dashboard/ReferralPanel";
import { WhiteLabelSettingsPanel } from "@/components/dashboard/WhiteLabelSettingsPanel";
import { ThemeSettingsPanel } from "@/components/theme/ThemeSettingsPanel";
import { DashboardPageHeader, Panel } from "@/components/dashboard/DashboardUI";
import {
  deleteWorkspace,
  getStoredWorkspaceId,
  runAudit,
  updateWorkspace,
} from "@/lib/client/api";
import { useRouter } from "next/navigation";
import type { WorkspaceSnapshotResponse } from "@/lib/api-types";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import {
  businessTypes,
  ONBOARDING_STORAGE_KEY,
  type OnboardingAnswers,
} from "@/lib/onboarding";
import { promptsFromPreferences } from "@/lib/audit/resolve-prompts";
import { PROMPT_LIMIT_FREE } from "@/lib/billing/limits";
import {
  defaultWorkspacePreferences,
  type WorkspacePreferences,
} from "@/lib/settings";
import { trackAuditCompleted, trackEvent } from "@/lib/analytics/track";
import { useToast } from "@/components/notifications/ToastProvider";
import { effectInit } from "@/lib/react/effect-init";

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-[#333] dark:bg-[#141414]";

type SettingsFormProps = {
  workspace: WorkspaceSnapshot;
  onSaved: (updated?: WorkspaceSnapshotResponse) => void;
  onDeleted?: () => void;
};

export function SettingsForm({ workspace, onSaved, onDeleted }: SettingsFormProps) {
  const router = useRouter();
  const toast = useToast();
  const workspaceId = workspace.workspaceId ?? workspace.id ?? getStoredWorkspaceId();

  const [domain, setDomain] = useState(workspace.domain);
  const [businessType, setBusinessType] = useState(workspace.businessType);
  const [description, setDescription] = useState(workspace.description);
  const [buyerQuestion, setBuyerQuestion] = useState(workspace.buyerQuestion);
  const [audiences, setAudiences] = useState<string[]>(workspace.audiences);
  const [competitors, setCompetitors] = useState<string[]>(workspace.competitors);
  const [audienceInput, setAudienceInput] = useState("");
  const [competitorInput, setCompetitorInput] = useState("");
  const [preferences, setPreferences] = useState<WorkspacePreferences>(
    workspace.preferences ?? defaultWorkspacePreferences,
  );

  const [saving, setSaving] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [testDigestState, setTestDigestState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [isFleet, setIsFleet] = useState(false);
  const [isPilot, setIsPilot] = useState(false);
  const [promptLimitMax, setPromptLimitMax] = useState<number | null>(
    PROMPT_LIMIT_FREE,
  );
  const [monitoredPromptsText, setMonitoredPromptsText] = useState("");

  useEffect(() => {
    void fetch("/api/billing/limits", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (d: { prompts?: { max: number | null } } | null) =>
          setPromptLimitMax(d?.prompts?.max ?? PROMPT_LIMIT_FREE),
      )
      .catch(() => setPromptLimitMax(PROMPT_LIMIT_FREE));
  }, []);

  useEffect(() => {
    void fetch("/api/billing/status", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { isFleet?: boolean; isPilot?: boolean; isPaid?: boolean } | null) => {
        setIsFleet(Boolean(d?.isFleet));
        setIsPilot(Boolean(d?.isPilot || d?.isPaid));
      })
      .catch(() => {
        setIsFleet(false);
        setIsPilot(false);
      });
  }, []);

  useEffect(() => {
    effectInit(() => {
      setDomain(workspace.domain);
      setBusinessType(workspace.businessType);
      setDescription(workspace.description);
      setBuyerQuestion(workspace.buyerQuestion);
      setAudiences(workspace.audiences);
      setCompetitors(workspace.competitors);
      setPreferences(workspace.preferences ?? defaultWorkspacePreferences);
      setMonitoredPromptsText(
        (workspace.preferences?.monitoredPrompts ?? []).join("\n"),
      );
    });
  }, [workspace]);

  function parseMonitoredPrompts(): string[] {
    return monitoredPromptsText
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);
  }

  function preferencesWithMonitoredPrompts(
    base: WorkspacePreferences = preferences,
  ): WorkspacePreferences {
    return {
      ...base,
      monitoredPrompts: parseMonitoredPrompts(),
    };
  }

  function addTag(
    value: string,
    list: string[],
    setList: (v: string[]) => void,
    max: number,
  ) {
    const v = value.trim();
    if (!v || list.includes(v) || list.length >= max) return;
    setList([...list, v]);
  }

  function removeTag(list: string[], setList: (v: string[]) => void, index: number) {
    setList(list.filter((_, i) => i !== index));
  }

  function buildAnswers(): OnboardingAnswers {
    return {
      domain,
      businessType,
      description,
      audiences,
      competitors,
      buyerQuestion,
      referral: "",
    };
  }

  async function sendTestDigest() {
    if (!workspaceId) {
      toast.error("No workspace selected. Refresh the page and try again.");
      return;
    }
    const email = preferences.monitoringEmail.trim();
    if (!email) {
      toast.error("Add a monitoring email first, then save settings.");
      return;
    }
    if (!isValidMonitoringEmail(email)) {
      toast.error("Enter a valid monitoring email address.");
      return;
    }

    const payload = { workspaceId, email };
    if (process.env.NODE_ENV === "development") {
      console.log("test-digest payload:", JSON.stringify(payload));
    }

    setTestDigestState("sending");
    try {
      const res = await fetch("/api/notifications/test-digest", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        hint?: string;
        sentTo?: string;
        details?: { fieldErrors?: Record<string, string[]>; formErrors?: string[] };
      };
      if (res.ok && data.ok) {
        setTestDigestState("sent");
        toast.success(`Test digest sent to ${data.sentTo ?? email}`);
        setTimeout(() => setTestDigestState("idle"), 4000);
      } else {
        setTestDigestState("error");
        const fieldMsg = data.details?.fieldErrors
          ? Object.entries(data.details.fieldErrors)
              .flatMap(([field, msgs]) => msgs.map((m) => `${field}: ${m}`))
              .join(" ")
          : null;
        toast.error(
          fieldMsg ?? data.error ?? `Failed to send test email (${res.status}).`,
          { description: data.hint },
        );
        setTimeout(() => setTestDigestState("idle"), 6000);
      }
    } catch {
      setTestDigestState("error");
      toast.error("Network error — could not send test email.");
      setTimeout(() => setTestDigestState("idle"), 4000);
    }
  }

  function isValidMonitoringEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  async function savePreferences(
    next: WorkspacePreferences,
    toastMsg = "Preferences saved.",
  ): Promise<boolean> {
    if (!workspaceId) {
      toast.error("No workspace found. Complete onboarding first.");
      return false;
    }

    setSavingPrefs(true);

    try {
      const updated = await updateWorkspace(workspaceId, {
        ...buildAnswers(),
        preferences: next,
      });

      if (!updated) {
        toast.error("Failed to save preferences.");
        return false;
      }

      setPreferences(updated.preferences ?? next);
      onSaved(updated);
      toast.success(toastMsg);
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
      return false;
    } finally {
      setSavingPrefs(false);
    }
  }

  async function persist(andAudit: boolean) {
    if (!workspaceId) {
      toast.error("No workspace found. Complete onboarding first.");
      return;
    }
    if (domain.trim().length < 3) {
      toast.error("Enter a valid domain.");
      return;
    }
    if (buyerQuestion.trim().length < 5) {
      toast.error("Buyer question must be at least 5 characters.");
      return;
    }

    setSaving(true);

    try {
      const answers = buildAnswers();
      const prefs = preferencesWithMonitoredPrompts();
      const updated = await updateWorkspace(workspaceId, {
        ...answers,
        preferences: prefs,
      });

      if (!updated) {
        toast.error("Failed to save settings.");
        return;
      }

      setPreferences(updated.preferences ?? prefs);
      sessionStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(answers));
      onSaved(updated);
      toast.success("Settings saved.");

      if (andAudit) {
        const promptList = promptsFromPreferences(prefs, answers.buyerQuestion);
        if (promptList.length === 0) {
          toast.error("Add at least one monitored prompt or buyer question.");
          return;
        }
        if (
          promptLimitMax !== null &&
          promptList.length > promptLimitMax
        ) {
          toast.error(
            `Your plan allows up to ${promptLimitMax} prompts per audit. Remove ${promptList.length - promptLimitMax} prompt(s) or upgrade.`,
          );
          return;
        }
        setAuditing(true);
        toast.info("Running citation audit…", {
          description: "Settings saved. This may take a minute.",
        });
        trackEvent("audit_started", {
          workspaceId,
          domain: answers.domain,
          source: "settings",
        });
        await runAudit({
          domain: answers.domain,
          prompts: promptList,
          workspaceId,
        });
        if (workspaceId) {
          trackAuditCompleted(workspaceId, {
            isSecond: workspace.hasRealAudit,
            source: "settings",
          });
        }
        onSaved(updated);
        toast.success("Settings saved and audit complete.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
      setAuditing(false);
    }
  }

  async function handleDelete() {
    if (!workspaceId) return;
    if (
      !window.confirm(
        "Delete this workspace and all audits? This cannot be undone.",
      )
    ) {
      return;
    }
    setDeleting(true);
    const ok = await deleteWorkspace(workspaceId);
    setDeleting(false);
    if (!ok) {
      toast.error("Failed to delete workspace.");
      return;
    }
    await onDeleted?.();
    router.push("/dashboard");
  }

  const busy = saving || auditing || deleting;
  const togglesBusy = saving || savingPrefs || auditing || deleting;
  const lastUpdated = workspace.updatedAt
    ? new Date(workspace.updatedAt).toLocaleString()
    : null;

  return (
    <>
      <GooeyFilter />
      <DashboardPageHeader
        headingLevel="h2"
        title="Edit workspace settings"
        description="Update your domain, money prompts, monitoring email, notifications, Autopilot, and white-label options."
        action={
          lastUpdated ? (
            <p className="text-xs text-muted">Last updated {lastUpdated}</p>
          ) : undefined
        }
      />

      <ThemeSettingsPanel />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void persist(false);
        }}
        className="space-y-6"
      >
        <Panel title="Workspace profile">
          <label className="block text-sm font-semibold text-ink">
            Domain
            <input
              type="text"
              required
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="acme.com"
              className={inputClass}
            />
          </label>

          <label className="mt-5 block text-sm font-semibold text-ink">
            Business category
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className={inputClass}
            >
              <option value="">Select category</option>
              {businessTypes.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.icon} {b.label}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-5 block text-sm font-semibold text-ink">
            Business description
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What you sell and who you serve"
              className={inputClass}
            />
          </label>
        </Panel>

        <Panel title="Citation tracking" className="border-l-4 border-l-accent">
          <label className="block text-sm font-semibold text-ink">
            Primary buyer question
            <span className="mt-1 block text-xs font-normal text-muted">
              The main prompt we track across AI surfaces
            </span>
            <textarea
              rows={3}
              required
              value={buyerQuestion}
              onChange={(e) => setBuyerQuestion(e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="mt-5 block text-sm font-semibold text-ink">
            Monitored prompts
            <span className="mt-1 block text-xs font-normal text-muted">
              One per line — used for audits and weekly re-scans.{" "}
              {promptLimitMax === null
                ? "Fleet: unlimited prompts."
                : `Your plan: up to ${promptLimitMax} prompts.`}
            </span>
            <textarea
              rows={6}
              value={monitoredPromptsText}
              onChange={(e) => setMonitoredPromptsText(e.target.value)}
              placeholder={`${buyerQuestion || "best tool for [category]"}\nalternatives to [competitor]`}
              className={inputClass}
            />
          </label>

          <div className="mt-5">
            <p className="text-sm font-semibold text-ink">Target audiences</p>
            <p className="text-xs text-muted">Up to 2 segments</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {audiences.map((a, i) => (
                <span
                  key={`aud-${i}-${a}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm"
                >
                  {a}
                  <button
                    type="button"
                    onClick={() => removeTag(audiences, setAudiences, i)}
                    className="text-muted hover:text-ink"
                    aria-label={`Remove ${a}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            {audiences.length < 2 && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={audienceInput}
                  onChange={(e) => setAudienceInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag(audienceInput, audiences, setAudiences, 2);
                      setAudienceInput("");
                    }
                  }}
                  placeholder="e.g. B2B founders"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => {
                    addTag(audienceInput, audiences, setAudiences, 2);
                    setAudienceInput("");
                  }}
                  className="shrink-0 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-ink hover:bg-surface"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          <div className="mt-5">
            <p className="text-sm font-semibold text-ink">Competitors</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {competitors.map((c, i) => (
                <span
                  key={`comp-${i}-${c}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm"
                >
                  {c}
                  <button
                    type="button"
                    onClick={() => removeTag(competitors, setCompetitors, i)}
                    className="text-muted hover:text-ink"
                    aria-label={`Remove ${c}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={competitorInput}
                onChange={(e) => setCompetitorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(competitorInput, competitors, setCompetitors, 8);
                    setCompetitorInput("");
                  }
                }}
                placeholder="Competitor domain or name"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => {
                  addTag(competitorInput, competitors, setCompetitors, 8);
                  setCompetitorInput("");
                }}
                className="shrink-0 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-ink hover:bg-surface"
              >
                Add
              </button>
            </div>
          </div>
        </Panel>

        <Panel title="Alerts" className="border-l-4 border-l-mint" id="alerts">
          {(isPilot || isFleet) &&
            (!preferences.monitoringEmail.trim() ||
              !preferences.whiteLabel.agencyName.trim()) && (
              <div
                className="mb-4 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm leading-relaxed text-amber-950"
                role="status"
              >
                <p className="font-semibold text-ink">Client-ready weekly reports</p>
                <p className="mt-1 text-muted">
                  Add a <strong>monitoring email</strong> and{" "}
                  <strong>agency name</strong> (White Label below) so Monday
                  proof report emails include your branding and a share link for
                  stakeholders.
                </p>
              </div>
            )}
          <p className="mb-4 text-sm text-muted">
            Pilot and Fleet workspaces re-scan monitored prompts weekly (Mondays)
            and can email digests or score-drop alerts when an address is set.
          </p>
          <label className="block text-sm font-semibold text-ink">
            Monitoring email
            <input
              type="email"
              value={preferences.monitoringEmail}
              onChange={(e) =>
                setPreferences((p) => ({
                  ...p,
                  monitoringEmail: e.target.value,
                }))
              }
              placeholder="you@company.com"
              className={inputClass}
            />
          </label>
          <EmailAlertsSettingsPanel
            embedded
            preferences={preferences}
            togglesBusy={togglesBusy}
            onPreferenceChange={(next) => {
              setPreferences(next);
              void savePreferences(next);
            }}
            testDigestButton={
              preferences.monitoringEmail.trim() ? (
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    disabled={testDigestState === "sending"}
                    onClick={() => void sendTestDigest()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-ink transition hover:bg-slate-100 disabled:opacity-50"
                  >
                    {testDigestState === "sending"
                      ? "Sending…"
                      : testDigestState === "sent"
                        ? "Sent!"
                        : "Send test digest"}
                  </button>
                  <span className="text-xs text-muted">
                    Sends a real email now to verify your address
                  </span>
                </div>
              ) : undefined
            }
          />
          {workspaceId && (
            <>
              <SlackAlertsPanel workspaceId={workspaceId} />
              <WebhookAlertsPanel workspaceId={workspaceId} />
            </>
          )}
        </Panel>

        {workspaceId && (
          <AutopilotSettingsPanel
            workspaceId={workspaceId}
            preferences={preferences}
            isPilot={isPilot || isFleet}
            togglesBusy={savingPrefs}
            onPreferencesChange={(next, toast) => {
              void savePreferences(next, toast);
            }}
          />
        )}

        {isFleet && workspaceId && (
          <FleetSettingsPanel
            workspaceId={workspaceId}
            onPromptsImported={(prompts) =>
              setMonitoredPromptsText(prompts.join("\n"))
            }
          />
        )}

        {(isPilot || isFleet) && workspaceId && (
          <Panel title="White Label">
            <p className="mb-4 text-sm text-muted">
              Brand proof reports, share links, and weekly digest emails with your agency
              identity. Fleet unlocks logo upload, colors, custom report domains, and email
              branding.
            </p>
            <WhiteLabelSettingsPanel
              workspaceId={workspaceId}
              preferences={preferences}
              isFleet={isFleet}
              isPilot={isPilot}
              togglesBusy={savingPrefs}
              onPreferencesChange={(next, toast) => {
                setPreferences(next);
                void savePreferences(next, toast);
              }}
              onPreferencesDraft={setPreferences}
            />
          </Panel>
        )}

        <Panel title="Workspace actions">
          <p className="mb-4 text-sm text-muted">
            Saves domain, profile, prompts, monitoring email, and white-label text
            fields. Notification toggles save when you flip them.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-deep disabled:opacity-60"
            >
              {saving && !auditing ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => persist(true)}
              className="rounded-full border border-accent bg-accent/10 px-6 py-3 text-sm font-semibold text-accent transition hover:bg-accent/20 disabled:opacity-60"
            >
              {auditing ? "Running audit…" : "Save & re-run audit"}
            </button>
            <Link
              href="/audit"
              className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-semibold text-ink transition hover:bg-surface"
            >
              Open audit tool
            </Link>
            <Link
              href="/start?full=1"
              className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-medium text-muted transition hover:text-ink"
            >
              Re-run full setup
            </Link>
          </div>
          {workspace.hasRealAudit && workspace.auditId && (
            <p className="mt-4 text-xs text-muted">
              Latest audit: {workspace.citationScore}/100 ({workspace.auditMode ?? "technical"})
            </p>
          )}
        </Panel>

        <Panel title="Account">
          <p className="text-sm text-muted">
            Signed in with Neon Auth. Sign out to switch accounts or use a shared computer.
          </p>
          <div className="mt-4">
            <SignOutButton className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-ink hover:bg-surface disabled:opacity-60" />
          </div>
        </Panel>

        {isPilot && <ReferralPanel />}

        <BillingPlanPanel />
        <Panel title="Danger zone" className="border-l-4 border-l-red-500">
          <p className="text-sm text-muted">
            Permanently remove this workspace, audits, and snapshots from your local
            database.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={handleDelete}
            className="mt-4 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete workspace"}
          </button>
        </Panel>
      </form>
    </>
  );
}
