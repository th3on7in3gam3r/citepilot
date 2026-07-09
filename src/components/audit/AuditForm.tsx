"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { UpgradePrompt } from "@/components/billing/UpgradePrompt";
import { AuditFeedbackSurvey } from "@/components/feedback/AuditFeedbackSurvey";
import { ProductCTAButton } from "@/components/ui/ProductCTA";
import type { AuditPayload } from "@/lib/api-types";
import { trackAuditCompleted, trackEvent } from "@/lib/analytics/track";
import { PROMPT_LIMIT_FREE } from "@/lib/billing/limits";
import { HERO_CTA_VARIANT_STORAGE_KEY } from "@/lib/analytics/feature-flags";
import { getStoredWorkspaceId, joinWaitlist, runAudit } from "@/lib/client/api";
import { ONBOARDING_STORAGE_KEY, type OnboardingAnswers } from "@/lib/onboarding";
import { auditDiagnosticPhases } from "@/lib/marketing/audit-landing";
import { kerygmaSignUpUrl } from "@/lib/growth-stack";
import { effectInit } from "@/lib/react/effect-init";

export function AuditForm() {
  const searchParams = useSearchParams();
  const [domain, setDomain] = useState("");
  const [prompts, setPrompts] = useState(
    "best tool for [your category]\nalternatives to [competitor]\nhow to choose [product type]",
  );
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditPayload | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSent, setWaitlistSent] = useState(false);
  const [promptLimitMax, setPromptLimitMax] = useState<number | null>(PROMPT_LIMIT_FREE);

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
      const fromUrl = searchParams.get("domain");
      const promptFromUrl = searchParams.get("prompt");
      if (fromUrl) setDomain(fromUrl);
      if (promptFromUrl) setPrompts(promptFromUrl);
      try {
        const raw = sessionStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw) as OnboardingAnswers;
        if (!fromUrl && data.domain) setDomain(data.domain);
        if (!promptFromUrl && data.buyerQuestion) setPrompts(data.buyerQuestion);
      } catch {
        /* ignore */
      }
    });
  }, [searchParams]);

  const promptCount = useMemo(
    () => prompts.split("\n").map((p) => p.trim()).filter(Boolean).length,
    [prompts],
  );
  const overPromptLimit = promptLimitMax !== null && promptCount > promptLimitMax;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!cleanDomain) return;

    setLoading(true);
    setLoadingPhase(0);
    setError(null);
    setResult(null);

    const phaseTimer = window.setInterval(() => {
      setLoadingPhase((p) => (p < auditDiagnosticPhases.length - 1 ? p + 1 : p));
    }, 11_000);

    const promptList = prompts.split("\n").map((p) => p.trim()).filter(Boolean);

    if (promptLimitMax !== null && promptList.length > promptLimitMax) {
      window.clearInterval(phaseTimer);
      setError(
        `Your plan allows up to ${promptLimitMax} prompts per audit. Remove ${promptList.length - promptLimitMax} line(s) or upgrade to Pilot.`,
      );
      setLoading(false);
      setLoadingPhase(0);
      return;
    }

    const workspaceId = getStoredWorkspaceId() ?? undefined;
    let heroCtaVariant: string | undefined;
    try {
      heroCtaVariant = sessionStorage.getItem(HERO_CTA_VARIANT_STORAGE_KEY) ?? undefined;
    } catch {
      /* ignore */
    }
    trackEvent("audit_started", {
      domain: cleanDomain,
      workspaceId,
      source: "public_audit",
      ...(heroCtaVariant ? { variant: heroCtaVariant, from: "hero" } : {}),
    });

    try {
      const audit = await runAudit({ domain: cleanDomain, prompts: promptList, workspaceId });
      setResult(audit);
      trackAuditCompleted(workspaceId ?? "anonymous", { source: "public_audit" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audit failed");
    } finally {
      window.clearInterval(phaseTimer);
      setLoading(false);
      setLoadingPhase(0);
    }
  }

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;
    const ok = await joinWaitlist(waitlistEmail);
    if (ok) setWaitlistSent(true);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      {/* ── Input form ── */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border bg-white p-7 shadow-sm md:p-9"
      >
        <h2 className="font-display text-lg font-bold text-ink">Run your audit</h2>
        <p className="mt-1 text-sm text-muted">Enter your domain and the buyer questions your customers ask AI.</p>

        <div className="mt-6 space-y-5">
          <div>
            <label htmlFor="audit-domain" className="block text-sm font-semibold text-ink">
              Domain
            </label>
            <input
              id="audit-domain"
              type="text"
              required
              aria-required="true"
              placeholder="acme.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "audit-form-error" : undefined}
              className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-ink outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <div>
            <label htmlFor="audit-prompts" className="block text-sm font-semibold text-ink">
              Buyer questions
            </label>
            <span id="audit-prompts-hint" className="mt-1 block text-xs font-normal text-muted">
              One per line — real questions buyers ask AI.{" "}
              {promptLimitMax === null
                ? "Unlimited on Fleet."
                : `Up to ${promptLimitMax} prompts on your plan.`}
            </span>
            <textarea
              id="audit-prompts"
              required
              aria-required="true"
              aria-describedby="audit-prompts-hint"
              rows={5}
              value={prompts}
              onChange={(e) => setPrompts(e.target.value)}
              className="mt-2 w-full resize-none rounded-xl border border-border px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>

        {overPromptLimit && (
          <div className="mt-4">
            <UpgradePrompt
              compact
              title="Prompt limit reached"
              description={`Your plan allows ${promptLimitMax} prompts per audit. Upgrade to Pilot for 25 or Fleet for unlimited monitoring.`}
            />
          </div>
        )}

        <div className="mt-7">
          <ProductCTAButton
            variant="accent"
            disabled={loading || overPromptLimit}
            sublabel={loading ? "Analyzing site…" : "Free · ~60 seconds"}
            showArrow={!loading}
          >
            {loading ? "Running citation audit…" : "Run citation audit"}
          </ProductCTAButton>
        </div>

        {error && (
          <div
            id="audit-form-error"
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        <p className="mt-4 text-center text-xs text-muted">
          {process.env.NEXT_PUBLIC_AUDIT_MODE === "live"
            ? "Live LLM checks enabled when OPENAI_API_KEY is set on the server."
            : "Technical GEO audit + on-site prompt analysis. Add OPENAI_API_KEY for live LLM citation checks."}
        </p>
      </form>

      {/* ── Results panel ── */}
      <div className="min-h-[320px]">

        {/* Empty state */}
        {!result && !loading && (
          <div className="flex h-full flex-col justify-center rounded-2xl border border-dashed border-border bg-white p-8">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10">
              <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="font-display text-lg font-bold text-ink">Your 60-second diagnostic report</p>
            <p className="mt-2 text-sm text-muted">
              Citation score, platform presence across 8 AI engines, per-prompt verdicts, and prioritized GEO gaps — generated after you run the audit.
            </p>
            <ul className="mt-5 space-y-2.5 text-xs">
              {auditDiagnosticPhases.slice(0, 3).map((phase) => (
                <li key={phase.id} className="flex items-start gap-3">
                  <span className="shrink-0 rounded-md bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-accent">
                    {phase.seconds}
                  </span>
                  <span className="text-muted">{phase.title}</span>
                </li>
              ))}
              <li className="flex items-start gap-3">
                <span className="shrink-0 rounded-md bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted">…</span>
                <span className="text-muted/70">Platform map + gap report</span>
              </li>
            </ul>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex h-full flex-col justify-center rounded-2xl border border-border bg-white p-8 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="relative h-12 w-12 shrink-0">
                <div className="h-12 w-12 animate-spin rounded-full border-2 border-border border-t-accent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-accent/40" />
                </div>
              </div>
              <div>
                <p className="font-semibold text-ink">Running engine diagnostic…</p>
                <p className="text-xs text-muted">
                  {auditDiagnosticPhases[loadingPhase]?.title ?? "Finishing up"}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent transition-all duration-1000"
                style={{ width: `${((loadingPhase + 1) / auditDiagnosticPhases.length) * 100}%` }}
              />
            </div>

            <ol className="mt-5 space-y-2">
              {auditDiagnosticPhases.map((phase, i) => (
                <li
                  key={phase.id}
                  className={`flex items-center gap-2.5 text-xs transition-colors ${
                    i <= loadingPhase ? "text-ink" : "text-muted/40"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      i < loadingPhase
                        ? "bg-mint/15 text-mint"
                        : i === loadingPhase
                          ? "bg-accent/15 text-accent"
                          : "bg-border/50 text-muted/30"
                    }`}
                    aria-hidden
                  >
                    {i < loadingPhase ? "✓" : i === loadingPhase ? "→" : String(i + 1)}
                  </span>
                  {phase.title}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">

            {/* Score card */}
            <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/5 to-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-accent">Citation score</p>
                  <p className="font-display mt-1 text-6xl font-bold text-ink">
                    {result.score}
                    <span className="ml-1 text-2xl font-normal text-muted">/100</span>
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    {result.cited} of {result.total} prompts cited for{" "}
                    <strong className="text-ink">{result.domain}</strong>
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Mode: {result.mode === "live" ? "Live LLM + technical" : "Technical analysis"}
                  </p>
                </div>
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-2xl font-bold text-accent">
                  {result.score >= 70 ? "🟢" : result.score >= 40 ? "🟡" : "🔴"}
                </div>
              </div>
            </div>

            {/* Platform presence */}
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <p className="mb-4 text-sm font-semibold text-ink">Platform presence</p>
              <ul className="space-y-2.5">
                {result.platforms.map((p) => (
                  <li key={p.name} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted">{p.name}</span>
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-accent transition-all"
                          style={{ width: p.present ? `${p.share}%` : "0%" }}
                        />
                      </div>
                      <span className={`w-20 text-right text-xs font-semibold ${p.present ? "text-accent" : "text-muted/50"}`}>
                        {p.present ? `${p.share}% share` : "Not cited"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Prompt results */}
            {result.promptResults.length > 0 && (
              <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <p className="mb-4 text-sm font-semibold text-ink">Prompt results</p>
                <ul className="space-y-2.5 text-sm">
                  {result.promptResults.map((pr) => (
                    <li key={pr.prompt} className="rounded-xl bg-surface px-4 py-3">
                      <p className="font-medium text-ink">{pr.prompt}</p>
                      <p className={`mt-1 flex items-center gap-1.5 text-xs ${pr.cited ? "text-mint" : "text-muted"}`}>
                        <span aria-hidden>{pr.cited ? "✓" : "○"}</span>
                        {pr.cited ? "Cited" : "Not cited"} — {pr.reason}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Gaps */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6">
              <p className="text-sm font-semibold text-ink">Top gaps to fix</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {result.gaps.map((g) => (
                  <li key={g} className="flex items-start gap-2.5">
                    <span className="mt-0.5 shrink-0 text-amber-500" aria-hidden>▲</span>
                    {g}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-white to-accent/5 p-6 shadow-sm">
              <p className="text-sm font-semibold text-ink">Turn visibility into published posts</p>
              <p className="mt-1 text-xs text-muted">
                Kerygma Social generates a month of on-brand social content from your URL — approve and
                publish on autopilot.
              </p>
              <a
                href={kerygmaSignUpUrl(result.domain)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90"
              >
                Generate posts with Kerygma Social →
              </a>
            </div>

            <AuditFeedbackSurvey
              auditId={result.id}
              workspaceId={result.workspaceId}
              domain={result.domain}
              score={result.score}
              source="public"
            />

            {/* Waitlist / upgrade */}
            {!waitlistSent ? (
              <form onSubmit={handleWaitlist} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-ink">Want weekly monitoring?</p>
                <p className="mt-1 text-xs text-muted">
                  Pilot and Fleet include weekly re-scans and citation history. Join the list for product updates.
                </p>
                <div className="mt-4 flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    className="min-w-0 flex-1 rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-deep"
                  >
                    Join waitlist
                  </button>
                </div>
              </form>
            ) : (
              <div className="rounded-2xl border border-mint/30 bg-mint/5 p-5 text-center">
                <p className="text-sm font-semibold text-mint">You&apos;re on the waitlist — we&apos;ll be in touch.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
