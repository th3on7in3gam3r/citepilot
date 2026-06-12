"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  calculatorIndustries,
  estimateCitationGap,
} from "@/lib/marketing/citation-gap-calculator";

export function CitationGapCalculator() {
  const [domain, setDomain] = useState("");
  const [industryId, setIndustryId] = useState("saas");
  const [competitors, setCompetitors] = useState("");

  const estimate = useMemo(() => {
    if (!domain.trim()) return null;
    return estimateCitationGap({ domain, industryId, competitors });
  }, [domain, industryId, competitors]);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm md:p-8">
        <h2 className="font-display text-lg font-bold text-white">
          Your inputs
        </h2>
        <p className="mt-1 text-sm text-white/55">
          Illustrative model — run a free audit for real citation data.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-white/90">
            Domain
            <input
              type="text"
              placeholder="yourcompany.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-accent"
            />
          </label>
          <label className="block text-sm font-semibold text-white/90">
            Industry
            <select
              value={industryId}
              onChange={(e) => setIndustryId(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/15 bg-[#0a101c] px-4 py-3 text-white outline-none focus:border-accent"
            >
              {calculatorIndustries.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-white/90">
            Competitors
            <span className="mt-1 block text-xs font-normal text-white/45">
              Comma-separated domains — e.g. rival.com, other.io
            </span>
            <textarea
              rows={3}
              value={competitors}
              onChange={(e) => setCompetitors(e.target.value)}
              placeholder="semrush.com, ahrefs.com"
              className="mt-2 w-full resize-none rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-accent"
            />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 md:p-8">
        {!estimate ? (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center">
            <p className="font-display text-lg font-bold text-white">
              Estimated citation gap
            </p>
            <p className="mt-2 max-w-xs text-sm text-white/50">
              Enter your domain to see an illustrative gap score and traffic
              opportunity range.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-glow">
              Estimate · not a live audit
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-white/45">Current citation rate</p>
                <p className="font-display mt-1 text-3xl font-bold text-white">
                  ~{estimate.estimatedCurrentRate}%
                </p>
              </div>
              <div className="rounded-xl border border-accent/30 bg-accent/10 p-4">
                <p className="text-xs text-white/45">Citation gap to close</p>
                <p className="font-display mt-1 text-3xl font-bold text-glow">
                  ~{estimate.estimatedGap} pts
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-white/45">Monthly AI discovery opportunity</p>
              <p className="mt-1 font-display text-2xl font-bold text-white">
                ~{estimate.monthlyOpportunityVisits.toLocaleString()} visits
              </p>
              <p className="mt-1 text-xs text-white/40">
                Competitor pressure: {estimate.competitorPressure}
              </p>
            </div>
            <p className="mt-4 text-sm text-white/65">
              <span className="font-semibold text-white">Suggested first fix: </span>
              {estimate.topFix}
            </p>
            <Link
              href={`/audit?domain=${encodeURIComponent(domain)}`}
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-bold text-white transition hover:bg-accent-deep"
            >
              Run free audit for real data →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
