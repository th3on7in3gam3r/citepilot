"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { OnboardingAside } from "@/components/onboarding/OnboardingAside";
import { OnboardingContinue } from "@/components/onboarding/OnboardingContinue";
import {
  businessTypes,
  ONBOARDING_STORAGE_KEY,
  stepMeta,
  TOTAL_STEPS,
  type OnboardingAnswers,
} from "@/lib/onboarding";
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

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>(initial);
  const [audienceInput, setAudienceInput] = useState("");
  const [competitorInput, setCompetitorInput] = useState("");

  const meta = stepMeta[step];
  const isLast = step === TOTAL_STEPS - 1;

  const [submitting, setSubmitting] = useState(false);

  function next() {
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
    else finish();
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  async function finish() {
    setSubmitting(true);
    sessionStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(answers));

    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });

      if (res.ok) {
        const data = (await res.json()) as { id: string };
        localStorage.setItem(WORKSPACE_STORAGE_KEY, data.id);

        const prompts = [answers.buyerQuestion].filter(Boolean);
        if (prompts.length > 0) {
          runAudit({
            domain: answers.domain,
            prompts,
            workspaceId: data.id,
          }).catch(() => undefined);
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
        return answers.domain.trim().length > 2;
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
      {/* Left: form — matches home light sections (cream + white) */}
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

        <main className="flex flex-1 flex-col px-6 pb-10 md:px-10 lg:px-14 lg:pb-14">
          <div className="mx-auto flex w-full max-w-[520px] flex-1 flex-col justify-center py-6 lg:py-10">
            {/* Step row */}
            <div className="mb-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="h-4 w-1 shrink-0 rounded-full bg-gradient-to-b from-glow to-accent" />
                <span className="text-sm font-bold text-ink">{meta.stepLabel}</span>
                {meta.optional && (
                  <span className="rounded-md bg-surface px-2 py-0.5 text-xs font-medium text-muted">
                    Optional
                  </span>
                )}
              </div>
              <span className="text-sm text-muted">
                Step {step + 1} of {TOTAL_STEPS}
              </span>
            </div>

            <h1 className="font-display text-3xl font-bold tracking-tight text-ink md:text-[2rem]">
              {meta.title}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-muted md:mt-4">
              {meta.subtitle}
            </p>

            <div className="mt-8 md:mt-10">
              {/* Step 1: Website */}
              {step === 0 && (
                <input
                  type="text"
                  value={answers.domain}
                  onChange={(e) =>
                    setAnswers((a) => ({ ...a, domain: e.target.value }))
                  }
                  placeholder="yourwebsite.com"
                  className="w-full rounded-full border border-border bg-white px-6 py-4 text-lg text-ink outline-none transition placeholder:text-muted/50 focus:border-accent focus:ring-2 focus:ring-accent/15"
                  onKeyDown={(e) => e.key === "Enter" && canContinue() && next()}
                />
              )}

              {/* Step 2: Business type grid */}
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

              {/* Step 3: Description + audiences */}
              {step === 2 && (
                <div className="space-y-8">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-bold text-ink">
                        Business description
                      </label>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-semibold text-ink transition hover:border-accent/40 hover:bg-surface"
                      >
                        <span className="text-accent">✦</span> Generate with AI
                      </button>
                    </div>
                    <textarea
                      value={answers.description}
                      onChange={(e) =>
                        setAnswers((a) => ({ ...a, description: e.target.value }))
                      }
                      placeholder="Enter a description of your business"
                      rows={5}
                      className="w-full resize-none rounded-2xl border border-border bg-white px-5 py-4 text-base text-ink outline-none transition placeholder:text-muted/50 focus:border-accent focus:ring-2 focus:ring-accent/15"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-ink">
                      Target audience
                      <span className="font-normal text-muted">
                        {answers.audiences.length}/2
                      </span>
                    </label>
                    <div className="relative mt-2">
                      <input
                        type="text"
                        value={audienceInput}
                        onChange={(e) => setAudienceInput(e.target.value)}
                        placeholder="e.g. marketing leaders at SaaS startups"
                        disabled={answers.audiences.length >= 2}
                        className="w-full rounded-full border border-border bg-white py-4 pl-5 pr-14 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:bg-surface"
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

              {/* Step 4: Competitors */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-border bg-surface px-5 py-4 text-sm leading-relaxed text-ink">
                    <p className="font-bold">Adding competitors helps us:</p>
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
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="relative">
                    <input
                      type="text"
                      value={competitorInput}
                      onChange={(e) => setCompetitorInput(e.target.value)}
                      placeholder="competitor.com"
                      className="w-full rounded-full border border-border bg-white py-4 pl-5 pr-14 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
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
                      className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-lg text-white transition hover:bg-accent-deep disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Step 5: Buyer question */}
              {step === 4 && (
                <div>
                  <label className="text-sm font-bold text-ink">
                    Buyer question
                  </label>
                  <input
                    type="text"
                    value={answers.buyerQuestion}
                    onChange={(e) =>
                      setAnswers((a) => ({ ...a, buyerQuestion: e.target.value }))
                    }
                    placeholder="e.g. best CRM for agencies under 50 seats"
                    className="mt-2 w-full rounded-full border border-border bg-white px-6 py-4 text-lg outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
                    onKeyDown={(e) => e.key === "Enter" && canContinue() && next()}
                  />
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
                  ? "Saving workspace…"
                  : isLast
                    ? "Run my analysis"
                    : "Continue"
              }
            />

            {step > 0 && (
              <button
                type="button"
                onClick={back}
                className="mt-4 w-full text-center text-sm font-medium text-muted hover:text-ink"
              >
                Back
              </button>
            )}
          </div>
        </main>
      </div>

      <OnboardingAside />
    </div>
  );
}
