"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { AuditPayload } from "@/lib/api-types";
import { PilotCheckoutButton } from "@/components/billing/PilotCheckoutButton";
import { PLATFORMS } from "@/lib/dashboard";
import { runAudit } from "@/lib/client/api";
import { trackEvent } from "@/lib/analytics/track";

function excerptForPlatform(
  platform: string,
  result: AuditPayload,
  prompt: string,
): string | null {
  const platformRow = result.platforms.find((p) => p.name === platform);
  if (!platformRow?.present) return null;

  const promptResult = result.promptResults[0];
  if (promptResult?.cited && promptResult.reason) {
    return promptResult.reason;
  }

  const signals = result.siteSignals;
  if (signals?.metaDescription) {
    return `Homepage signals support "${prompt.slice(0, 48)}${prompt.length > 48 ? "…" : ""}" — ${signals.metaDescription.slice(0, 120)}${signals.metaDescription.length > 120 ? "…" : ""}`;
  }
  if (signals?.title) {
    return `Entity match on ${platform}: ${signals.title}`;
  }
  return `Brand presence detected on ${platform} for this prompt.`;
}

export function CitationCheckerTool() {
  const [domain, setDomain] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditPayload | null>(null);

  const citedCount = useMemo(
    () => result?.platforms.filter((p) => p.present).length ?? 0,
    [result],
  );

  useEffect(() => {
    if (result) {
      trackEvent("tool_result_viewed", {
        tool_name: "citation-checker",
        cited_platforms: citedCount,
        score: result.score,
      });
    }
  }, [result, citedCount]);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "").trim();
    const cleanQuery = query.trim();
    if (!cleanDomain || !cleanQuery) return;

    setLoading(true);
    setError(null);
    setResult(null);
    trackEvent("tool_used", { tool_name: "citation-checker", domain: cleanDomain });
    trackEvent("citation_checker_started", { domain: cleanDomain });

    try {
      const audit = await runAudit({
        domain: cleanDomain,
        prompts: [cleanQuery],
      });
      setResult(audit);
      trackEvent("citation_checker_completed", {
        domain: cleanDomain,
        cited: audit.cited,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check failed");
    } finally {
      setLoading(false);
    }
  }

  function trackUpgradeClick() {
    trackEvent("tool_upgrade_cta_clicked", {
      tool_name: "citation-checker",
      plan: "pilot",
    });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <form
        onSubmit={handleCheck}
        className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm md:p-8"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-white/90">
            Domain
            <input
              type="text"
              required
              placeholder="yourcompany.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <label className="block text-sm font-semibold text-white/90">
            Buyer question (money prompt)
            <input
              type="text"
              required
              placeholder="best CRM for small agencies"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-full bg-gradient-to-r from-[#7b93f0] via-[#6b8cff] to-accent px-6 py-3.5 text-sm font-bold text-white shadow-[0_8px_32px_rgba(14,165,233,0.35)] transition hover:opacity-95 disabled:opacity-60"
        >
          {loading ? "Checking citations…" : "Check citation"}
        </button>

        {error && (
          <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}
      </form>

      {(loading || result) && (
        <div className="mt-8 space-y-6 rounded-2xl border border-white/10 bg-white/[0.06] p-6 md:p-8">
          {loading && !result && (
            <p className="text-sm text-white/60">Analyzing across AI platforms… ~30–60 seconds</p>
          )}

          {(loading || result) && (
            <>
              {result && (
                <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-glow">
                    Citation score for this prompt
                  </p>
                  <p className="font-display mt-1 text-4xl font-bold text-white">
                    {citedCount}/{PLATFORMS.length}{" "}
                    <span className="text-lg font-semibold text-white/50">platforms</span>
                  </p>
                </div>
                <p className="text-sm text-white/55">
                  GEO score {result.score}/100 · {result.mode === "live" ? "Live checks" : "Technical signals"}
                </p>
              </div>
              )}

              <ul className="space-y-3">
                {PLATFORMS.map((name) => {
                  const row = result?.platforms.find((p) => p.name === name);
                  const cited = row?.present ?? false;
                  const excerpt =
                    result && cited ? excerptForPlatform(name, result, query) : null;
                  return (
                    <li
                      key={name}
                      className="rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-white">{name}</span>
                        <span
                          className={`text-xs font-bold ${
                            loading && !result
                              ? "text-white/45"
                              : cited
                                ? "text-mint"
                                : "text-red-300"
                          }`}
                        >
                          {loading && !result
                            ? "Checking…"
                            : cited
                              ? "Cited ✓"
                              : "Not cited ✗"}
                        </span>
                      </div>
                      {excerpt && (
                        <p className="mt-2 text-xs leading-relaxed text-white/55">{excerpt}</p>
                      )}
                    </li>
                  );
                })}
              </ul>

              {result?.gaps[0] && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  <span className="font-semibold">Top fix: </span>
                  {result.gaps[0]}
                </div>
              )}

              {result && (
              <Link
                href={`/audit?domain=${encodeURIComponent(result.domain)}&prompt=${encodeURIComponent(query)}`}
                className="inline-flex w-full items-center justify-center rounded-full border border-white/20 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Run full free audit (10 prompts) →
              </Link>
              )}
            </>
          )}
        </div>
      )}

      {result && (
        <div className="mt-10 rounded-2xl border border-accent/30 bg-accent/10 p-6 text-center">
          <p className="font-display text-lg font-bold text-white">
            Want to track 25 prompts weekly?
          </p>
          <p className="mt-2 text-sm text-white/65">
            Pilot monitors your money prompts across all major AI engines with citation
            alerts and proof reports.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3" onClick={trackUpgradeClick}>
            <PilotCheckoutButton signedIn={false} plan="pilot" source="tool_citation_checker">
              Upgrade to Pilot →
            </PilotCheckoutButton>
          </div>
        </div>
      )}
    </div>
  );
}
