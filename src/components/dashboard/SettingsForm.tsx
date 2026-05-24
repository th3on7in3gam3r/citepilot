"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { BillingPlanPanel } from "@/components/billing/BillingPlanPanel";
import { DashboardPageHeader, Panel } from "@/components/dashboard/DashboardUI";
import {
  deleteWorkspace,
  getStoredWorkspaceId,
  runAudit,
  updateWorkspace,
} from "@/lib/client/api";
import { useRouter } from "next/navigation";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import {
  businessTypes,
  ONBOARDING_STORAGE_KEY,
  type OnboardingAnswers,
} from "@/lib/onboarding";
import {
  defaultWorkspacePreferences,
  type WorkspacePreferences,
} from "@/lib/settings";

const inputClass =
  "mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";

type SettingsFormProps = {
  workspace: WorkspaceSnapshot;
  onSaved: () => void;
};

export function SettingsForm({ workspace, onSaved }: SettingsFormProps) {
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
  const [auditing, setAuditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setDomain(workspace.domain);
    setBusinessType(workspace.businessType);
    setDescription(workspace.description);
    setBuyerQuestion(workspace.buyerQuestion);
    setAudiences(workspace.audiences);
    setCompetitors(workspace.competitors);
    setPreferences(workspace.preferences ?? defaultWorkspacePreferences);
  }, [workspace]);

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
      const updated = await updateWorkspace(workspaceId, {
        ...answers,
        preferences,
      });

      if (!updated) {
        setError("Failed to save settings.");
        return;
      }

      sessionStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(answers));
      onSaved();
      setMessage("Settings saved.");

      if (andAudit) {
        setAuditing(true);
        setMessage("Settings saved. Running citation audit…");
        await runAudit({
          domain: answers.domain,
          prompts: [answers.buyerQuestion],
          workspaceId,
        });
        onSaved();
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
    router.push("/start");
  }

  const busy = saving || auditing || deleting;
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
          persist(false);
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
          <p className="mb-4 text-sm text-muted">
            Pilot monitoring — emails send when you add a monitoring address.
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
                  key: "discussionAlerts" as const,
                  label: "Discussion opportunity alerts",
                  hint: "HN & Stack Overflow threads in your niche",
                },
              ] as const
            ).map((item) => (
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
                  onClick={() =>
                    setPreferences((p) => ({
                      ...p,
                      [item.key]: !p[item.key],
                    }))
                  }
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
            ))}
          </ul>
        </Panel>

        <Panel title="Workspace actions">
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
              href="/start"
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
