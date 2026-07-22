"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { AuditPayload } from "@/lib/api-types";
import { ToolUpgradePanel } from "@/components/tools/ToolUpgradePanel";
import { PillButtonAction } from "@/components/ui/PillButton";
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

  function trackStartClick() {
    trackEvent("tool_upgrade_cta_clicked", {
      tool_name: "citation-checker",
      cta: "start_setup",
    });
  }

  const startHref = result
    ? `/start?domain=${encodeURIComponent(result.domain)}`
    : "/start";

  return (
    <div className="mx-auto max-w-4xl">
      <form onSubmit={handleCheck} className="tool-panel">
        <div className="tool-panel-inner">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-ink">
              Domain
              <input
                type="text"
                required
                placeholder="yourcompany.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="tool-input mt-2"
              />
            </label>
            <label className="block text-sm font-semibold text-ink">
              Buyer question (money prompt)
              <input
                type="text"
                required
                placeholder="best CRM for small agencies"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="tool-input mt-2"
              />
            </label>
          </div>

          <PillButtonAction
            type="submit"
            disabled={loading}
            className="mt-6 w-full"
          >
            {loading ? "Checking citations…" : "Check citation"}
          </PillButtonAction>

          {error && (
            <p
              className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
      </form>

      {(loading || result) && (
        <div className="tool-panel mt-8">
          <div className="tool-panel-inner space-y-6">
            {loading && !result && (
              <p className="text-sm text-muted">
                Analyzing across AI platforms… ~30–60 seconds
              </p>
            )}

            {result && (
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                    Citation score for this prompt
                  </p>
                  <p className="font-display mt-1 text-4xl font-bold text-ink">
                    {citedCount}/{PLATFORMS.length}{" "}
                    <span className="text-lg font-semibold text-muted">platforms</span>
                  </p>
                </div>
                <p className="text-sm text-muted">
                  GEO score {result.score}/100 ·{" "}
                  {result.mode === "live" ? "Live checks" : "Technical signals"}
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
                  <li key={name} className="tool-result-row">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-ink">{name}</span>
                      <span
                        className={`text-xs font-bold ${
                          loading && !result
                            ? "text-muted"
                            : cited
                              ? "text-mint"
                              : "text-red-600"
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
                      <p className="mt-2 text-xs leading-relaxed text-muted">{excerpt}</p>
                    )}
                  </li>
                );
              })}
            </ul>

            {result?.gaps[0] && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                <span className="font-semibold">Top fix: </span>
                {result.gaps[0]}
              </div>
            )}

            {result && (
              <Link
                href={`/start?domain=${encodeURIComponent(result.domain)}&prompt=${encodeURIComponent(query)}`}
                onClick={trackStartClick}
                className="btn-marketing-primary inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm"
              >
                Set up full workspace audit →
              </Link>
            )}
          </div>
        </div>
      )}

      {result && (
        <div onClick={trackStartClick}>
          <ToolUpgradePanel
            href={startHref}
            title="Want to track 25 prompts weekly?"
            description="Create a workspace to monitor your money prompts across all major AI engines with citation alerts and proof reports."
            ctaLabel="Start free setup →"
            secondaryHref="/dashboard"
            secondaryLabel="Open dashboard"
          />
        </div>
      )}
    </div>
  );
}
