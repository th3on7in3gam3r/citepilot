"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  calculatorIndustries,
  citationGapFormulaExplanation,
  estimateCitationGap,
} from "@/lib/marketing/citation-gap-calculator";
import { trackEvent } from "@/lib/analytics/track";

const TRAFFIC_PRESETS = [
  { label: "5K/mo", value: 5000 },
  { label: "25K/mo", value: 25000 },
  { label: "100K/mo", value: 100000 },
  { label: "500K/mo", value: 500000 },
];

export function CitationGapCalculator() {
  const [step, setStep] = useState(0);
  const [industryId, setIndustryId] = useState("saas");
  const [monthlyTraffic, setMonthlyTraffic] = useState(25000);
  const [competitor, setCompetitor] = useState("");
  const [platformsCited, setPlatformsCited] = useState(2);
  const [showFormula, setShowFormula] = useState(false);
  const [animated, setAnimated] = useState(false);

  const estimate = useMemo(
    () =>
      estimateCitationGap({
        industryId,
        monthlyTraffic,
        platformsCited,
        competitorDomain: competitor || undefined,
      }),
    [industryId, monthlyTraffic, platformsCited, competitor],
  );

  useEffect(() => {
    if (step >= 4) {
      trackEvent("tool_result_viewed", {
        tool_name: "citation-gap-calculator",
        monthly_opportunity: estimate.monthlyOpportunityVisits,
      });
      setAnimated(false);
      const t = setTimeout(() => setAnimated(true), 50);
      return () => clearTimeout(t);
    }
  }, [step, estimate.monthlyOpportunityVisits]);

  function next() {
    if (step === 3) {
      trackEvent("tool_used", { tool_name: "citation-gap-calculator", industry: industryId });
    }
    setStep((s) => Math.min(4, s + 1));
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              step > i ? "bg-accent" : "bg-white/15"
            }`}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm md:p-8">
        {step === 0 && (
          <>
            <h2 className="font-display text-lg font-bold text-white">Step 1 — Your industry</h2>
            <p className="mt-1 text-sm text-white/55">We benchmark citation rates by category.</p>
            <select
              value={industryId}
              onChange={(e) => setIndustryId(e.target.value)}
              className="mt-6 w-full rounded-xl border border-white/15 bg-[#0a101c] px-4 py-3 text-white outline-none focus:border-accent"
            >
              {calculatorIndustries.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label}
                </option>
              ))}
            </select>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="font-display text-lg font-bold text-white">Step 2 — Monthly traffic</h2>
            <p className="mt-1 text-sm text-white/55">Organic + direct visits to your site.</p>
            <input
              type="range"
              min={1000}
              max={500000}
              step={1000}
              value={monthlyTraffic}
              onChange={(e) => setMonthlyTraffic(Number(e.target.value))}
              className="mt-6 w-full accent-accent"
            />
            <p className="mt-3 font-display text-2xl font-bold text-white">
              {monthlyTraffic.toLocaleString()} visits/mo
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {TRAFFIC_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setMonthlyTraffic(p.value)}
                  className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white/70 hover:border-accent/40"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="font-display text-lg font-bold text-white">
              Step 3 — Primary competitor (optional)
            </h2>
            <input
              type="text"
              placeholder="competitor.com"
              value={competitor}
              onChange={(e) => setCompetitor(e.target.value)}
              className="mt-6 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-accent"
            />
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="font-display text-lg font-bold text-white">
              Step 4 — AI platforms you appear on
            </h2>
            <p className="mt-1 text-sm text-white/55">How many of 8 major engines cite you today?</p>
            <input
              type="range"
              min={0}
              max={8}
              step={1}
              value={platformsCited}
              onChange={(e) => setPlatformsCited(Number(e.target.value))}
              className="mt-6 w-full accent-accent"
            />
            <p className="mt-3 font-display text-2xl font-bold text-white">
              {platformsCited} / 8 platforms
            </p>
          </>
        )}

        {step < 4 && (
          <div className="mt-8 flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={back}
                className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="flex-1 rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-white hover:bg-accent-deep"
            >
              {step === 3 ? "Calculate gap →" : "Continue →"}
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-glow">
              Your estimate · illustrative model
            </p>
            <div
              className={`grid gap-4 transition-all duration-700 ${animated ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
            >
              <div className="rounded-xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs text-white/45">Estimated monthly AI discovery you&apos;re missing</p>
                <p className="font-display mt-1 text-3xl font-bold text-white">
                  ~{estimate.monthlyOpportunityVisits.toLocaleString()} visitors
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs text-white/45">Citation gap vs competitors / category</p>
                <p className="font-display mt-1 text-3xl font-bold text-amber-200">
                  −{estimate.gapVsCategoryPct}% below average
                </p>
              </div>
              <div className="rounded-xl border border-accent/30 bg-accent/10 p-5">
                <p className="text-xs text-white/45">Projected citation lift with weekly GEO monitoring</p>
                <p className="font-display mt-1 text-3xl font-bold text-glow">
                  +{estimate.projectedLift90d}% in 90 days
                </p>
              </div>
            </div>

            <Link
              href="/audit"
              onClick={() =>
                trackEvent("tool_upgrade_cta_clicked", {
                  tool_name: "citation-gap-calculator",
                  cta: "free_audit",
                })
              }
              className="inline-flex w-full items-center justify-center rounded-full bg-accent px-6 py-3.5 text-sm font-bold text-white hover:bg-accent-deep"
            >
              Get your real citation score — free audit →
            </Link>

            <button
              type="button"
              onClick={() => setShowFormula((v) => !v)}
              className="w-full text-left text-sm font-semibold text-white/60 hover:text-white"
            >
              {showFormula ? "Hide" : "How we calculate this"} ▾
            </button>
            {showFormula && (
              <ul className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/65">
                {citationGapFormulaExplanation.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="text-accent">•</span>
                    {line}
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              onClick={() => setStep(0)}
              className="text-sm font-semibold text-white/50 hover:text-white"
            >
              ← Start over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
