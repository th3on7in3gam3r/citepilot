"use client";

import { useState } from "react";
import Link from "next/link";
import type { AuditPayload } from "@/lib/api-types";
import { joinWaitlist, runAudit } from "@/lib/client/api";
import { trackEvent } from "@/lib/analytics/track";

export function CitationCheckerTool() {
  const [domain, setDomain] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditPayload | null>(null);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "").trim();
    const cleanQuery = query.trim();
    if (!cleanDomain || !cleanQuery) return;

    setLoading(true);
    setError(null);
    setResult(null);
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

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    const ok = await joinWaitlist(email.trim());
    if (ok) setEmailSent(true);
  }

  const promptResult = result?.promptResults?.[0];
  const citedPlatforms =
    result?.platforms?.filter((p) => p.present).map((p) => p.name) ?? [];

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
      <form
        onSubmit={handleCheck}
        className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm md:p-8"
      >
        <h2 className="font-display text-lg font-bold text-white">
          Check one prompt
        </h2>
        <p className="mt-1 text-sm text-white/55">
          Enter your domain and a buyer question. We scan on-site signals and AI
          engine presence — free, no account.
        </p>

        <div className="mt-6 space-y-4">
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
            Buyer question
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
          {loading ? "Checking citation…" : "Check citation"}
        </button>

        {error && (
          <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}
      </form>

      <div className="min-h-[280px]">
        {!result && !loading && (
          <div className="flex h-full flex-col justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
            <p className="font-display text-lg font-bold text-white">
              Instant citation verdict
            </p>
            <p className="mt-2 text-sm text-white/50">
              See if your site supports this prompt and which AI engines likely
              cite you.
            </p>
          </div>
        )}

        {loading && (
          <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] p-8">
            <p className="text-sm text-white/60">Analyzing… ~30–60 seconds</p>
          </div>
        )}

        {result && (
          <div className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.06] p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-glow">
                  Citation check
                </p>
                <p className="mt-1 font-display text-3xl font-bold text-white">
                  {promptResult?.cited ? "Likely cited" : "Not cited yet"}
                </p>
                <p className="mt-2 text-sm text-white/55">
                  GEO score {result.score}/100 · {result.cited}/{result.total}{" "}
                  prompts on full audit
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                  promptResult?.cited
                    ? "bg-mint/20 text-mint"
                    : "bg-amber-500/20 text-amber-200"
                }`}
              >
                {promptResult?.cited ? "✓ Cited" : "Gap"}
              </span>
            </div>

            {citedPlatforms.length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                  Platforms with presence
                </p>
                <p className="mt-2 text-sm text-white/75">
                  {citedPlatforms.join(" · ")}
                </p>
              </div>
            ) : (
              <p className="text-sm text-white/55">
                No strong platform presence detected for this prompt yet.
              </p>
            )}

            {result.gaps[0] && (
              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">
                <span className="font-semibold text-white/90">Top fix: </span>
                {result.gaps[0]}
              </div>
            )}

            <Link
              href={`/audit?domain=${encodeURIComponent(result.domain)}&prompt=${encodeURIComponent(query)}`}
              className="inline-flex w-full items-center justify-center rounded-full border border-white/20 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Run full free audit (10 prompts) →
            </Link>

            {!emailSent ? (
              <form
                onSubmit={handleEmail}
                className="border-t border-white/10 pt-5"
              >
                <p className="text-sm font-semibold text-white">
                  Get weekly citation alerts
                </p>
                <p className="mt-1 text-xs text-white/45">
                  Join the list — we&apos;ll notify you when monitoring opens for
                  your domain.
                </p>
                <div className="mt-3 flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-accent"
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-ink"
                  >
                    Notify me
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-sm font-semibold text-mint">
                You&apos;re on the list — we&apos;ll be in touch.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
