"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { OnboardingAside } from "@/components/onboarding/OnboardingAside";
import { OnboardingContinue } from "@/components/onboarding/OnboardingContinue";
import {
  OnboardingDomainInput,
  type DomainInputStatus,
} from "@/components/onboarding/OnboardingDomainInput";
import { OnboardingExitIntent } from "@/components/onboarding/OnboardingExitIntent";
import { OnboardingMobileTestimonial } from "@/components/onboarding/OnboardingMobileTestimonial";
import { OnboardingStepProgress } from "@/components/onboarding/OnboardingStepProgress";
import {
  businessTypes,
  ONBOARDING_STORAGE_KEY,
  ONBOARDING_WELCOME_TOAST_KEY,
  stepMeta,
  TOTAL_STEPS,
  type OnboardingAnswers,
} from "@/lib/onboarding";
import {
  FEATURE_FLAGS,
  ONBOARDING_PROMPT_EXAMPLES,
} from "@/lib/analytics/feature-flags";
import { useFeatureFlagVariant } from "@/hooks/useFeatureFlagVariant";
import { trackAuditCompleted, trackEvent } from "@/lib/analytics/track";
import { effectInit } from "@/lib/react/effect-init";
import { runAudit } from "@/lib/client/api";
import { WORKSPACE_STORAGE_KEY } from "@/lib/constants";

const initial: OnboardingAnswers = {
  domain: "",
  businessType: "",
  description: "",
  audiences: [],
  competitors: [],
  buyerQuestion: "",
  referral: "",
};

function syncStepUrl(stepIndex: number, mode: "push" | "replace") {
  const url = new URL(window.location.href);
  if (stepIndex === 0) url.searchParams.delete("step");
  else url.searchParams.set("step", String(stepIndex + 1));
  window.history[mode === "push" ? "pushState" : "replaceState"](
    { onboardingStep: stepIndex },
    "",
    url,
  );
}

export function OnboardingFlow({
  initialDomain,
  initialPromptVariant,
}: {
  initialDomain?: string;
  initialPromptVariant?: string;
}) {
  const router = useRouter();
  const promptSuggestionsVariant = useFeatureFlagVariant(
    FEATURE_FLAGS.ONBOARDING_PROMPT_SUGGESTIONS,
    { initialVariant: initialPromptVariant, fallback: "control" },
  );
  const showPromptSuggestions = promptSuggestionsVariant === "variant_a";
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>(initial);
  const [audienceInput, setAudienceInput] = useState("");
  const [competitorInput, setCompetitorInput] = useState("");
  const [domainStatus, setDomainStatus] = useState<DomainInputStatus>("idle");
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const meta = stepMeta[step];
  const isLast = step === TOTAL_STEPS - 1;

  useEffect(() => {
    effectInit(() => {
      if (sessionStorage.getItem("citepilot_signup_tracked")) return;
      trackEvent("signup_completed", { method: "onboarding" });
      sessionStorage.setItem("citepilot_signup_tracked", "1");
    });
  }, []);

  useEffect(() => {
    void fetch("/api/referrals/claim", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }).catch(() => {
      /* OAuth signup — claim referral from cookie if present */
    });
    void fetch("/api/widget/badge-referral", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }).catch(() => {
      /* OAuth signup — badge referral from cookie if present */
    });
  }, []);

  useEffect(() => {
    if (!initialDomain) return;
    const clean = initialDomain
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "")
      .trim()
      .toLowerCase();
    if (!clean) return;
    setAnswers((prev) => (prev.domain ? prev : { ...prev, domain: clean }));
  }, [initialDomain]);

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("step");
    let initialStep = 0;
    if (param) {
      const n = parseInt(param, 10);
      if (n >= 1 && n <= TOTAL_STEPS) initialStep = n - 1;
      setStep(initialStep);
    }
    syncStepUrl(initialStep, "replace");
  }, []);

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const fromState = (e.state as { onboardingStep?: number } | null)
        ?.onboardingStep;
      if (typeof fromState === "number") {
        setStep(fromState);
        return;
      }
      const param = new URLSearchParams(window.location.search).get("step");
      setStep(param ? Math.max(0, parseInt(param, 10) - 1) : 0);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const handleDomainStatus = useCallback((status: DomainInputStatus) => {
    setDomainStatus(status);
  }, []);

  function next() {
    if (step < TOTAL_STEPS - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      syncStepUrl(nextStep, "push");
    } else {
      void finish();
    }
  }

  function back() {
    if (step > 0) window.history.back();
  }

  async function finish() {
    setSubmitting(true);
    setCompleted(true);
    sessionStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(answers));
    sessionStorage.setItem(ONBOARDING_WELCOME_TOAST_KEY, "1");

    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });

      if (res.ok) {
        const data = (await res.json()) as { id: string };
        localStorage.setItem(WORKSPACE_STORAGE_KEY, data.id);
        sessionStorage.removeItem(ONBOARDING_STORAGE_KEY);

        trackEvent("workspace_created", { domain: answers.domain });

        const prompts = [answers.buyerQuestion].filter(Boolean);
        if (prompts.length > 0) {
          trackEvent("audit_started", {
            workspaceId: data.id,
            source: "onboarding",
            variant: promptSuggestionsVariant,
          });
          void runAudit({
            domain: answers.domain,
            prompts,
            workspaceId: data.id,
          })
            .then(() => {
              trackAuditCompleted(data.id);
              trackEvent("first_scan_completed", {
                workspaceId: data.id,
                variant: promptSuggestionsVariant,
              });
            })
            .catch(() => undefined);
        }
      }
    } catch {
      /* proceed to dashboard with sessionStorage fallback */
    }

    router.push("/dashboard?welcome=1");
  }

  function canContinue(): boolean {
    switch (step) {
      case 0:
        return domainStatus === "valid" || domainStatus === "unreachable";
      case 1:
        return answers.businessType.length > 0;
      case 2:
        return answers.description.trim().length > 10;
      case 3:
        return true;
      case 4:
        return answers.buyerQuestion.trim().length > 5;
      default:
        return false;
    }
  }

  function addAudience() {
    const v = audienceInput.trim();
    if (!v || answers.audiences.length >= 2 || answers.audiences.includes(v))
      return;
    setAnswers((a) => ({ ...a, audiences: [...a.audiences, v] }));
    setAudienceInput("");
  }

  function removeAudience(i: number) {
    setAnswers((a) => ({
      ...a,
      audiences: a.audiences.filter((_, idx) => idx !== i),
    }));
  }

  function addCompetitor() {
    const v = competitorInput
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");
    if (!v || answers.competitors.includes(v)) return;
    setAnswers((a) => ({ ...a, competitors: [...a.competitors, v] }));
    setCompetitorInput("");
  }

  function removeCompetitor(i: number) {
    setAnswers((a) => ({
      ...a,
      competitors: a.competitors.filter((_, idx) => idx !== i),
    }));
  }

  return (
    <div className="min-h-[100dvh] bg-cream lg:flex">
      <div className="flex min-h-[100dvh] flex-1 flex-col bg-white lg:border-r lg:border-border">
        <header className="flex h-16 items-center justify-between border-b border-border px-6 md:h-[4.5rem] md:px-10 lg:border-b-0 lg:px-12">
          <Logo />
          <Link
            href="/"
            className="text-sm font-medium text-muted hover:text-ink"
          >
            Exit
          </Link>
        </header>

        <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col px-6 pb-10 md:px-10 lg:px-14 lg:pb-14">
          <h1 className="sr-only">Start GEO and AI citation analysis</h1>
          <div className="mx-auto flex w-full max-w-[520px] flex-1 flex-col justify-center py-6 lg:py-10">
            <OnboardingStepProgress step={step} />

            <div className="mb-6 flex items-center gap-2">
              <span className="h-4 w-1 shrink-0 rounded-full bg-gradient-to-b from-glow to-accent" />
              <span className="text-sm font-bold text-ink">{meta.stepLabel}</span>
              {meta.optional && (
                <span className="rounded-md bg-surface px-2 py-0.5 text-xs font-medium text-muted">
                  Optional
                </span>
              )}
            </div>

            <h2 className="font-display text-3xl font-bold tracking-tight text-ink md:text-[2rem]">
              {meta.title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted md:mt-4">
              {meta.subtitle}
            </p>

            <div className="mt-8 md:mt-10">
              {step === 0 && (
                <OnboardingDomainInput
                  value={answers.domain}
                  onChange={(domain) => setAnswers((a) => ({ ...a, domain }))}
                  onStatusChange={handleDomainStatus}
                  onEnter={() => canContinue() && next()}
                />
              )}

              {step === 1 && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {businessTypes.map((opt) => {
                    const selected = answers.businessType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setAnswers((a) => ({ ...a, businessType: opt.id }))
                        }
                        className={`flex items-center gap-3 rounded-2xl border px-4 py-4 text-left text-sm font-semibold transition sm:text-base ${
                          selected
                            ? "border-accent bg-accent/5 ring-1 ring-accent/25"
                            : "border-border bg-surface hover:border-accent/40"
                        }`}
                      >
                        <span className="text-xl" aria-hidden>
                          {opt.icon}
                        </span>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8">
                  <div>
                    <label htmlFor="onboarding-description" className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-bold text-ink">
                        Business description
                      </span>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-semibold text-ink transition hover:border-accent/40 hover:bg-surface"
                      >
                        <span className="text-accent" aria-hidden>✦</span> Generate with AI
                      </button>
                    </label>
                    <textarea
                      id="onboarding-description"
                      value={answers.description}
                      onChange={(e) =>
                        setAnswers((a) => ({ ...a, description: e.target.value }))
                      }
                      placeholder="Enter a description of your business"
                      rows={5}
                      required
                      aria-required="true"
                      className="w-full resize-none rounded-2xl border border-border bg-white px-5 py-4 text-base text-ink outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/15"
                    />
                  </div>

                  <div>
                    <label htmlFor="onboarding-audience" className="flex items-center gap-2 text-sm font-bold text-ink">
                      Target audience
                      <span className="font-normal text-muted">
                        {answers.audiences.length}/2
                      </span>
                    </label>
                    <div className="relative mt-2">
                      <input
                        id="onboarding-audience"
                        type="text"
                        value={audienceInput}
                        onChange={(e) => setAudienceInput(e.target.value)}
                        placeholder="e.g. marketing leaders at SaaS startups"
                        disabled={answers.audiences.length >= 2}
                        className="w-full rounded-full border border-border bg-white py-4 pl-5 pr-14 text-base outline-none placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:bg-surface"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addAudience();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={addAudience}
                        disabled={
                          !audienceInput.trim() || answers.audiences.length >= 2
                        }
                        className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-lg font-medium text-white transition hover:bg-accent-deep disabled:opacity-40"
                        aria-label="Add audience"
                      >
                        +
                      </button>
                    </div>
                    {answers.audiences.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {answers.audiences.map((a, i) => (
                          <span
                            key={`audience-${i}`}
                            className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-medium text-ink"
                          >
                            {a}
                            <button
                              type="button"
                              onClick={() => removeAudience(i)}
                              className="text-muted hover:text-ink"
                              aria-label={`Remove ${a}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-border bg-surface px-5 py-4 text-sm leading-relaxed text-ink">
                    <h3 className="font-bold">Adding competitors helps us</h3>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-muted">
                      <li>
                        <strong className="text-ink">Find content gaps</strong>{" "}
                        where they get cited and you don&apos;t.
                      </li>
                      <li>
                        <strong className="text-ink">Benchmark AI visibility</strong>{" "}
                        on the same buyer questions.
                      </li>
                    </ul>
                  </div>

                  {answers.competitors.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {answers.competitors.map((c, i) => (
                        <span
                          key={`competitor-${i}`}
                          className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2.5 text-sm font-medium shadow-sm"
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface text-xs font-bold text-muted">
                            G
                          </span>
                          {c}
                          <button
                            type="button"
                            onClick={() => removeCompetitor(i)}
                            className="text-muted hover:text-ink"
                            aria-label={`Remove competitor ${c}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <label htmlFor="onboarding-competitor" className="sr-only">
                    Competitor domain
                  </label>
                  <div className="relative">
                    <input
                      id="onboarding-competitor"
                      type="text"
                      value={competitorInput}
                      onChange={(e) => setCompetitorInput(e.target.value)}
                      placeholder="competitor.com"
                      className="w-full rounded-full border border-border bg-white py-4 pl-5 pr-14 text-base outline-none placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/15"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCompetitor();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={addCompetitor}
                      disabled={!competitorInput.trim()}
                      aria-label="Add competitor"
                      className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-lg text-white transition hover:bg-accent-deep disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <label htmlFor="onboarding-buyer-question" className="text-sm font-bold text-ink">
                    Buyer question
                  </label>
                  <input
                    id="onboarding-buyer-question"
                    type="text"
                    required
                    aria-required="true"
                    value={answers.buyerQuestion}
                    onChange={(e) =>
                      setAnswers((a) => ({ ...a, buyerQuestion: e.target.value }))
                    }
                    placeholder="e.g. best CRM for agencies under 50 seats"
                    className="mt-2 w-full rounded-full border border-border bg-white px-6 py-4 text-lg outline-none placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/15"
                    onKeyDown={(e) => e.key === "Enter" && canContinue() && next()}
                  />
                  {showPromptSuggestions && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Example prompts — tap to use
                      </p>
                      <ul className="mt-2 flex flex-col gap-2">
                        {ONBOARDING_PROMPT_EXAMPLES.map((example) => (
                          <li key={example}>
                            <button
                              type="button"
                              onClick={() =>
                                setAnswers((a) => ({ ...a, buyerQuestion: example }))
                              }
                              className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                                answers.buyerQuestion === example
                                  ? "border-accent bg-accent/5 font-semibold text-ink ring-1 ring-accent/25"
                                  : "border-border bg-surface text-muted hover:border-accent/40 hover:text-ink"
                              }`}
                            >
                              {example}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="mt-3 text-sm text-muted">
                    Tip: use a question your customers actually ask AI before they
                    buy.
                  </p>
                </div>
              )}
            </div>

            <OnboardingContinue
              onClick={next}
              disabled={!canContinue() || submitting}
              label={
                submitting
                  ? "Starting your audit…"
                  : isLast
                    ? "Run my analysis"
                    : "Continue"
              }
            />

            {step > 0 && !submitting && (
              <button
                type="button"
                onClick={back}
                className="mt-4 w-full text-center text-sm font-medium text-muted hover:text-ink"
              >
                Back
              </button>
            )}

            <OnboardingMobileTestimonial />
          </div>
        </main>
      </div>

      <OnboardingAside />
      <OnboardingExitIntent active={!completed} completed={completed} step={step} />
    </div>
  );
}
