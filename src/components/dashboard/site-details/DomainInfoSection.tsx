"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { updateWorkspace } from "@/lib/client/api";
import type { WorkspaceSnapshotResponse } from "@/lib/api-types";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import { ONBOARDING_STORAGE_KEY, type OnboardingAnswers } from "@/lib/onboarding";
import { PROMPT_LIMIT_FREE } from "@/lib/billing/limits";
import {
  INDUSTRY_OPTIONS,
  SITE_MODEL_OPTIONS,
} from "@/lib/site-details-sections";
import {
  defaultWorkspacePreferences,
  type WorkspacePreferences,
} from "@/lib/settings";
import { SiteDetailsFooter } from "@/components/dashboard/site-details/SiteDetailsShared";
import { useToast } from "@/components/notifications/ToastProvider";
import { effectInit } from "@/lib/react/effect-init";
import { siteDetailsInputClass } from "@/lib/dashboard/surface-classes";

const inputClass = siteDetailsInputClass;

type DomainInfoSectionProps = {
  workspace: WorkspaceSnapshot;
  workspaceId: string;
  onSaved: (updated?: WorkspaceSnapshotResponse) => void;
  onContinue: () => void;
  mode?: "full" | "targeting" | "competitors" | "keywords";
};

export function DomainInfoSection({
  workspace,
  workspaceId,
  onSaved,
  onContinue,
  mode = "full",
}: DomainInfoSectionProps) {
  const [domain, setDomain] = useState(workspace.domain);
  const [client, setClient] = useState(workspace.description);
  const [industry, setIndustry] = useState(workspace.businessType || "saas");
  const [siteModel, setSiteModel] = useState(
    SITE_MODEL_OPTIONS.find((m) => m.businessType === workspace.businessType)?.id ??
      "single-location",
  );
  const [competitors, setCompetitors] = useState<string[]>(workspace.competitors);
  const [audiences, setAudiences] = useState<string[]>(workspace.audiences);
  const [buyerQuestion, setBuyerQuestion] = useState(workspace.buyerQuestion);
  const [competitorInput, setCompetitorInput] = useState("");
  const [audienceInput, setAudienceInput] = useState("");
  const [monitoredPromptsText, setMonitoredPromptsText] = useState("");
  const [preferences, setPreferences] = useState<WorkspacePreferences>(
    workspace.preferences ?? defaultWorkspacePreferences,
  );
  const [promptLimitMax, setPromptLimitMax] = useState<number | null>(PROMPT_LIMIT_FREE);
  const toast = useToast();
  const [saving, setSaving] = useState(false);

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
    effectInit(() => {
      setDomain(workspace.domain);
      setClient(workspace.description);
      setIndustry(workspace.businessType || "saas");
      setSiteModel(
        SITE_MODEL_OPTIONS.find((m) => m.businessType === workspace.businessType)?.id ??
          "single-location",
      );
      setCompetitors(workspace.competitors);
      setAudiences(workspace.audiences);
      setBuyerQuestion(workspace.buyerQuestion);
      setPreferences(workspace.preferences ?? defaultWorkspacePreferences);
      setMonitoredPromptsText(
        (workspace.preferences?.monitoredPrompts ?? []).join("\n"),
      );
    });
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
      domain: domain.replace(/^https?:\/\//, "").replace(/\/$/, ""),
      businessType: industry,
      description: client,
      audiences,
      competitors,
      buyerQuestion,
      referral: "",
    };
  }

  function preferencesWithPrompts(): WorkspacePreferences {
    const prompts = monitoredPromptsText
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);
    return { ...preferences, monitoredPrompts: prompts };
  }

  async function save(andContinue: boolean) {
    if (!domain.trim()) {
      toast.error("Enter a valid domain.");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateWorkspace(workspaceId, {
        ...buildAnswers(),
        preferences: preferencesWithPrompts(),
      });
      if (!updated) {
        toast.error("Failed to save site details.");
        return;
      }
      sessionStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(buildAnswers()));
      onSaved(updated);
      toast.success("Site details saved.");
      if (andContinue) onContinue();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const showFull = mode === "full";
  const showCompetitors = mode === "full" || mode === "competitors";
  const showTargeting = mode === "full" || mode === "targeting";
  const showKeywords = mode === "full" || mode === "keywords";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save(true);
      }}
      className="space-y-6"
    >
      {showFull && (
        <>
          <label className="block text-sm font-semibold text-ink">
            Select Domain
            <div className="relative mt-2">
              <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[#0ea5e9]">
                🌐
              </span>
              <input
                type="url"
                value={domain.startsWith("http") ? domain : `https://${domain}`}
                onChange={(e) => setDomain(e.target.value)}
                className={`${inputClass} pl-11`}
                placeholder="https://www.example.com"
              />
            </div>
          </label>

          {showCompetitors && (
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-ink">Backlinks</label>
                <span className="text-xs text-muted">
                  {competitors.length} / 5
                </span>
              </div>
              <div className="mt-2 flex min-h-[52px] flex-wrap gap-2 rounded-xl border border-border bg-card px-3 py-2">
                {competitors.map((c, i) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-2 rounded-lg bg-surface px-3 py-1.5 text-sm text-ink"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => removeTag(competitors, setCompetitors, i)}
                      className="text-[#94a3b8] hover:text-ink"
                      aria-label={`Remove ${c}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {competitors.length < 5 && (
                  <input
                    type="text"
                    value={competitorInput}
                    onChange={(e) => setCompetitorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag(competitorInput, competitors, setCompetitors, 5);
                        setCompetitorInput("");
                      }
                    }}
                    placeholder="Add competitor domain…"
                    className="min-w-[140px] flex-1 border-0 bg-transparent py-1.5 text-sm outline-none"
                  />
                )}
              </div>
              <p className="mt-1.5 text-xs text-muted">
                Maximum 5 competitor domains with your current plan.
              </p>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-ink">
              Client
              <input
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Your brand or client name"
                className={inputClass}
              />
            </label>
            <label className="block text-sm font-semibold text-ink">
              <span className="flex items-center gap-1">
                Industry
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#e2e8f0] text-[10px] font-normal text-[#94a3b8]">
                  i
                </span>
              </span>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className={inputClass}
              >
                {INDUSTRY_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {showTargeting && (
            <div>
              <label className="text-sm font-semibold text-ink">Anchors</label>
              <div className="mt-2 flex min-h-[52px] flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
                {audiences.slice(0, 1).map((a, i) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#e0f2fe] px-3 py-1.5 text-sm text-[#065f46]"
                  >
                    {a}
                    <button
                      type="button"
                      onClick={() => removeTag(audiences, setAudiences, i)}
                      className="text-muted hover:text-ink"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {audiences.length > 1 && (
                  <span className="rounded-lg bg-surface px-3 py-1.5 text-sm text-muted">
                    +{audiences.length - 1} more
                  </span>
                )}
                {audiences.length < 2 && (
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
                    placeholder="Add audience segment…"
                    className="min-w-[120px] flex-1 border-0 bg-transparent py-1.5 text-sm outline-none"
                  />
                )}
              </div>
            </div>
          )}

          <fieldset>
            <legend className="text-sm font-semibold text-ink">Business Type</legend>
            <div className="mt-3 divide-y divide-[#eef2f6] rounded-xl border border-[#e2e8f0]">
              {SITE_MODEL_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className="flex cursor-pointer items-center gap-3 px-4 py-3.5 transition hover:bg-[#f8fafb]"
                >
                  <input
                    type="radio"
                    name="siteModel"
                    value={opt.id}
                    checked={siteModel === opt.id}
                    onChange={() => setSiteModel(opt.id)}
                    className="h-4 w-4 border-[#cbd5e1] text-[#0ea5e9] focus:ring-[#0ea5e9]"
                  />
                  <span className="text-sm text-foreground/80">{opt.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="rounded-xl border border-[#fce7f3] bg-[#fff1f2]/40 px-4 py-4">
            <p className="text-sm font-semibold text-ink">
              Privacy Settings{" "}
              <Link
                href="/pricing"
                className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#fce7f3] px-2 py-0.5 text-[11px] font-bold text-[#db2777]"
              >
                ⚡ Upgrade plan
              </Link>
            </p>
            <p className="mt-1 text-sm text-muted">
              Configure white-label share links and proof report privacy on Fleet.{" "}
              <Link href="/dashboard/settings" className="font-medium text-[#0ea5e9]">
                Learn more
              </Link>
            </p>
          </div>
        </>
      )}

      {mode === "targeting" && !showFull && (
        <>
          <label className="block text-sm font-semibold text-ink">
            Primary buyer question
            <textarea
              rows={3}
              value={buyerQuestion}
              onChange={(e) => setBuyerQuestion(e.target.value)}
              className={inputClass}
            />
          </label>
          <div>
            <label className="text-sm font-semibold text-ink">Target audiences</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {audiences.map((a, i) => (
                <span
                  key={a}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#e0f2fe] px-3 py-1.5 text-sm"
                >
                  {a}
                  <button type="button" onClick={() => removeTag(audiences, setAudiences, i)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
            {audiences.length < 2 && (
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
                placeholder="Add audience…"
                className={inputClass}
              />
            )}
          </div>
        </>
      )}

      {mode === "competitors" && !showFull && (
        <div>
          <label className="text-sm font-semibold text-ink">Competitor domains</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {competitors.map((c, i) => (
              <span
                key={c}
                className="inline-flex items-center gap-2 rounded-lg bg-surface px-3 py-1.5 text-sm"
              >
                {c}
                <button type="button" onClick={() => removeTag(competitors, setCompetitors, i)}>
                  ×
                </button>
              </span>
            ))}
          </div>
          {competitors.length < 5 && (
            <input
              type="text"
              value={competitorInput}
              onChange={(e) => setCompetitorInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(competitorInput, competitors, setCompetitors, 5);
                  setCompetitorInput("");
                }
              }}
              placeholder="Add competitor…"
              className={inputClass}
            />
          )}
        </div>
      )}

      {showKeywords && mode !== "full" && (
        <label className="block text-sm font-semibold text-ink">
          Monitored money prompts
          <span className="mt-1 block text-xs font-normal text-muted">
            One per line ·{" "}
            {promptLimitMax === null
              ? "Fleet: unlimited"
              : `Up to ${promptLimitMax} on your plan`}
          </span>
          <textarea
            rows={8}
            value={monitoredPromptsText}
            onChange={(e) => setMonitoredPromptsText(e.target.value)}
            className={inputClass}
          />
        </label>
      )}

      <SiteDetailsFooter
        saving={saving}
        onSave={() => void save(false)}
        onSaveContinue={() => void save(true)}
      />
    </form>
  );
}
