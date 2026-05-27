"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { UpgradePrompt } from "@/components/billing/UpgradePrompt";
import { ProductCTAButton } from "@/components/ui/ProductCTA";
import type { AuditPayload } from "@/lib/api-types";
import { trackAuditCompleted, trackEvent } from "@/lib/analytics/track";
import { PROMPT_LIMIT_FREE } from "@/lib/billing/limits";
import { getStoredWorkspaceId, joinWaitlist, runAudit } from "@/lib/client/api";
import { ONBOARDING_STORAGE_KEY, type OnboardingAnswers } from "@/lib/onboarding";
import { effectInit } from "@/lib/react/effect-init";

export function AuditForm() {
  const searchParams = useSearchParams();
  const [domain, setDomain] = useState("");
  const [prompts, setPrompts] = useState(
    "best tool for [your category]\nalternatives to [competitor]\nhow to choose [product type]",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditPayload | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSent, setWaitlistSent] = useState(false);
  const [promptLimitMax, setPromptLimitMax] = useState<number | null>(
    PROMPT_LIMIT_FREE,
  );

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
    () =>
      prompts
        .split("\n")
        .map((p) => p.trim())
        .filter(Boolean).length,
    [prompts],
  );
  const overPromptLimit =
    promptLimitMax !== null && promptCount > promptLimitMax;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!cleanDomain) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const promptList = prompts
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);

    if (promptLimitMax !== null && promptList.length > promptLimitMax) {
      setError(
        `Your plan allows up to ${promptLimitMax} prompts per audit. Remove ${promptList.length - promptLimitMax} line(s) or upgrade to Pilot.`,
      );
      setLoading(false);
      return;
    }

    const workspaceId = getStoredWorkspaceId() ?? undefined;
    trackEvent("audit_started", {
      domain: cleanDomain,
      workspaceId,
      source: "public_audit",
    });

    try {
      const audit = await runAudit({
        domain: cleanDomain,
        prompts: promptList,
        workspaceId,
      });
      setResult(audit);
      trackAuditCompleted(workspaceId ?? "anonymous", {
        source: "public_audit",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audit failed");
    } finally {
      setLoading(false);
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
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border bg-white p-8 shadow-sm md:p-10"
      >
        <label className="block text-sm font-semibold text-ink">
          Your domain
          <input
            type="text"
            required
            placeholder="acme.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-ink outline-none ring-accent/0 transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>

        <label className="mt-6 block text-sm font-semibold text-ink">
          Buyer questions
          <span className="mt-1 block text-xs font-normal text-muted">
            One per line — real questions buyers ask AI.{" "}
            {promptLimitMax === null
              ? "Unlimited on Fleet."
              : `Up to ${promptLimitMax} prompts on your plan.`}
          </span>
          <textarea
            required
            rows={5}
            value={prompts}
            onChange={(e) => setPrompts(e.target.value)}
            className="mt-2 w-full resize-none rounded-xl border border-border px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>

        {overPromptLimit && (
          <div className="mt-4">
            <UpgradePrompt
              compact
              title="Prompt limit reached"
              description={`Your plan allows ${promptLimitMax} prompts per audit. Upgrade to Pilot for ${25} or Fleet for unlimited monitoring.`}
            />
          </div>
        )}

        <div className="mt-8">
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
          <p className="mt-4 text-center text-sm text-red-600">{error}</p>
        )}

        <p className="mt-4 text-center text-xs text-muted">
          {process.env.NEXT_PUBLIC_AUDIT_MODE === "live"
            ? "Live LLM checks enabled when OPENAI_API_KEY is set on the server."
            : "Technical GEO audit + on-site prompt analysis. Add OPENAI_API_KEY for live LLM citation checks."}
        </p>
      </form>

      <div className="min-h-[320px]">
        {!result && !loading && (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
            <p className="font-display text-lg font-bold text-ink">
              Your citation map appears here
            </p>
            <p className="mt-2 max-w-xs text-sm text-muted">
              We&apos;ll fetch your site, score GEO readiness, and check each
              buyer question against your homepage content.
            </p>
          </div>
        )}

        {loading && (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="mt-4 text-sm font-medium text-muted">
              Fetching {domain || "site"} and analyzing GEO signals…
            </p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-white p-6">
              <p className="text-sm text-muted">Citation score</p>
              <p className="font-display text-5xl font-bold text-ink">
                {result.score}
                <span className="text-2xl text-muted">/100</span>
              </p>
              <p className="mt-2 text-sm text-muted">
                {result.cited} of {result.total} prompts cited for{" "}
                <strong className="text-ink">{result.domain}</strong>
              </p>
              <p className="mt-1 text-xs text-muted">
                Mode: {result.mode === "live" ? "Live LLM + technical" : "Technical analysis"}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-white p-6">
              <p className="mb-3 text-sm font-semibold text-ink">
                Platform presence
              </p>
              <ul className="space-y-2">
                {result.platforms.map((p) => (
                  <li
                    key={p.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted">{p.name}</span>
                    <span
                      className={
                        p.present
                          ? "font-semibold text-accent"
                          : "text-muted"
                      }
                    >
                      {p.present ? `${p.share}% share` : "Not cited"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {result.promptResults.length > 0 && (
              <div className="rounded-2xl border border-border bg-white p-6">
                <p className="mb-3 text-sm font-semibold text-ink">
                  Prompt results
                </p>
                <ul className="space-y-3 text-sm">
                  {result.promptResults.map((pr) => (
                    <li key={pr.prompt} className="rounded-xl bg-surface px-4 py-3">
                      <p className="font-medium text-ink">{pr.prompt}</p>
                      <p className={`mt-1 ${pr.cited ? "text-mint" : "text-muted"}`}>
                        {pr.cited ? "Cited" : "Not cited"} — {pr.reason}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-2xl border border-accent/40 bg-accent/10 p-6">
              <p className="text-sm font-semibold text-ink">Top gaps to fix</p>
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-muted">
                {result.gaps.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </div>

            {!waitlistSent ? (
              <form onSubmit={handleWaitlist} className="rounded-2xl border border-border bg-white p-6">
                <p className="text-sm font-semibold text-ink">
                  Want weekly monitoring?
                </p>
                <p className="mt-1 text-xs text-muted">
                  Pilot and Fleet include weekly re-scans and citation history — see
                  Pricing to upgrade, or join the list for product updates.
                </p>
                <div className="mt-3 flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    className="min-w-0 flex-1 rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
                  >
                    Join waitlist
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-center text-sm font-medium text-mint">
                You&apos;re on the waitlist — we&apos;ll be in touch.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
