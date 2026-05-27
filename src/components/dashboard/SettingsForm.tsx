"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { BillingPlanPanel } from "@/components/billing/BillingPlanPanel";
import { UpgradePrompt } from "@/components/billing/UpgradePrompt";
import { AutopilotSettingsPanel } from "@/components/dashboard/AutopilotSettingsPanel";
import { FleetSettingsPanel } from "@/components/dashboard/FleetSettingsPanel";
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
import { effectInit } from "@/lib/react/effect-init";

const inputClass =
  "mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";

type SettingsFormProps = {
  workspace: WorkspaceSnapshot;
  onSaved: (updated?: WorkspaceSnapshotResponse) => void;
  onDeleted?: () => void;
};

export function SettingsForm({ workspace, onSaved, onDeleted }: SettingsFormProps) {
  const router = useRouter();
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
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState(false);
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

  async function savePreferences(
    next: WorkspacePreferences,
    toast = "Preferences saved.",
  ): Promise<boolean> {
    if (!workspaceId) {
      setError("No workspace found. Complete onboarding first.");
      return false;
    }

    setSavingPrefs(true);
    setError(null);

    try {
      const updated = await updateWorkspace(workspaceId, {
        ...buildAnswers(),
        preferences: next,
      });

      if (!updated) {
        setError("Failed to save preferences.");
        return false;
      }

      setPreferences(updated.preferences ?? next);
      onSaved(updated);
      setMessage(toast);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      return false;
    } finally {
      setSavingPrefs(false);
    }
  }

  async function persist(andAudit: boolean) {
    if (!workspaceId) {
      setError("No workspace found. Complete onboarding first.");
      return;
    }
    if (domain.trim().length < 3) {
      setError("Enter a valid domain.");
      return;
    }
    if (buyerQuestion.trim().length < 5) {
      setError("Buyer question must be at least 5 characters.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const answers = buildAnswers();
      const prefs = preferencesWithMonitoredPrompts();
      const updated = await updateWorkspace(workspaceId, {
        ...answers,
        preferences: prefs,
      });

      if (!updated) {
        setError("Failed to save settings.");
        return;
      }

      setPreferences(updated.preferences ?? prefs);
      sessionStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(answers));
      onSaved(updated);
      setMessage("Settings saved.");

      if (andAudit) {
        const promptList = promptsFromPreferences(prefs, answers.buyerQuestion);
        if (promptList.length === 0) {
          setError("Add at least one monitored prompt or buyer question.");
          return;
        }
        if (
          promptLimitMax !== null &&
          promptList.length > promptLimitMax
        ) {
          setError(
            `Your plan allows up to ${promptLimitMax} prompts per audit. Remove ${promptList.length - promptLimitMax} prompt(s) or upgrade.`,
          );
          return;
        }
        setAuditing(true);
        setMessage("Settings saved. Running citation audit…");
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
        setMessage("Settings saved and audit complete.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
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
    setError(null);
    const ok = await deleteWorkspace(workspaceId);
    setDeleting(false);
    if (!ok) {
      setError("Failed to delete workspace.");
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
      <DashboardPageHeader
        title="Settings"
        description="Edit your workspace profile, tracked prompts, and notification preferences."
        action={
          lastUpdated ? (
            <p className="text-xs text-muted">Last updated {lastUpdated}</p>
          ) : undefined
        }
      />

      {(message || error) && (
        <div
          className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-mint/30 bg-mint/10 text-ink"
          }`}
        >
          {error ?? message}
        </div>
      )}

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

        <Panel title="Citation tracking">
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

        <Panel title="Notifications">
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
                  <strong>agency name</strong> (Client reporting below) so Monday
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
          <ul className="mt-4 space-y-3">
            {(
              [
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
                  hint: "Email when prompts are lost, platforms slip, or competitor gaps appear (Pilot+)",
                },
                {
                  key: "proofReportEmail" as const,
                  label: "Weekly proof report email",
                  hint: "After Monday re-scan: score delta, proof report link, and client share URL (Pilot+)",
                },
                {
                  key: "discussionAlerts" as const,
                  label: "Discussion opportunity alerts",
                  hint: "HN & Stack Overflow threads in your niche",
                },
              ] as const
            ).map((item) => {
              const needsPilot =
                (item.key === "competitorMoveAlerts" ||
                  item.key === "proofReportEmail") &&
                !isPilot &&
                !isFleet;
              return (
              <li
                key={item.key}
                className="flex items-start justify-between gap-4 rounded-xl bg-surface px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{item.label}</p>
                  <p className="text-xs text-muted">{item.hint}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={preferences[item.key]}
                  disabled={togglesBusy || needsPilot}
                  onClick={() => {
                    if (needsPilot) return;
                    const next = {
                      ...preferences,
                      [item.key]: !preferences[item.key],
                    };
                    setPreferences(next);
                    void savePreferences(next);
                  }}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                    preferences[item.key] ? "bg-accent" : "bg-border"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                      preferences[item.key] ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </li>
            );
            })}
          </ul>
          {!isPilot && !isFleet && (
            <div className="mt-4">
              <UpgradePrompt
                compact
                title="Competitor move alerts (Pilot+)"
                description="Get email when you lose prompts, platforms slip, or new competitor gaps appear."
              />
            </div>
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

        {(isPilot || isFleet) && (
          <Panel title="Client reporting">
            <p className="mb-4 text-sm text-muted">
              Shown on the stakeholder proof report and in weekly proof report
              emails after Monday re-scans. Fleet can also hide CitePilot branding
              on share links.
            </p>
            <label className="block text-sm font-semibold text-ink">
              Agency / client-facing name
              <input
                type="text"
                value={preferences.whiteLabel.agencyName}
                onChange={(e) =>
                  setPreferences((p) => ({
                    ...p,
                    whiteLabel: { ...p.whiteLabel, agencyName: e.target.value },
                  }))
                }
                placeholder="Your agency or client brand"
                className={inputClass}
              />
            </label>
            {isFleet && (
              <>
                <label className="mt-5 block text-sm font-semibold text-ink">
                  Logo URL
                  <input
                    type="url"
                    value={preferences.whiteLabel.logoUrl}
                    onChange={(e) =>
                      setPreferences((p) => ({
                        ...p,
                        whiteLabel: { ...p.whiteLabel, logoUrl: e.target.value },
                      }))
                    }
                    placeholder="https://…/logo.png"
                    className={inputClass}
                  />
                </label>
                <label className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-surface px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      Hide “Powered by CitePilot”
                    </p>
                    <p className="text-xs text-muted">
                      On audit share links and proof report PDF export
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={preferences.whiteLabel.hidePoweredBy}
                    disabled={togglesBusy}
                    onClick={() => {
                      const next = {
                        ...preferences,
                        whiteLabel: {
                          ...preferences.whiteLabel,
                          hidePoweredBy: !preferences.whiteLabel.hidePoweredBy,
                        },
                      };
                      setPreferences(next);
                      void savePreferences(
                        next,
                        next.whiteLabel.hidePoweredBy
                          ? "White-label saved — share links will hide CitePilot branding."
                          : "White-label saved — CitePilot credit will show on share links.",
                      );
                    }}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                      preferences.whiteLabel.hidePoweredBy
                        ? "bg-accent"
                        : "bg-border"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                        preferences.whiteLabel.hidePoweredBy
                          ? "left-[22px]"
                          : "left-0.5"
                      }`}
                    />
                  </button>
                </label>
              </>
            )}
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
              className="rounded-full bg-gradient-to-r from-[#7b93f0] via-[#6b8cff] to-accent px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(107,140,255,0.3)] disabled:opacity-60"
            >
              {saving && !auditing ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => persist(true)}
              className="rounded-full border border-accent bg-accent/10 px-6 py-3 text-sm font-semibold text-accent disabled:opacity-60"
            >
              {auditing ? "Running audit…" : "Save & re-run audit"}
            </button>
            <Link
              href="/audit"
              className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-semibold text-ink hover:bg-surface"
            >
              Open audit tool
            </Link>
            <Link
              href="/start?full=1"
              className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-medium text-muted hover:text-ink"
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

        <BillingPlanPanel />
        <Panel title="Danger zone">
          <p className="text-sm text-muted">
            Permanently remove this workspace, audits, and snapshots from your local
            database.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={handleDelete}
            className="mt-4 rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete workspace"}
          </button>
        </Panel>
      </form>
    </>
  );
}
