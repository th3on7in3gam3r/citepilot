"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { trackEvent } from "@/lib/analytics/track";

export function ProofReportGetOwnCta({ domainHint }: { domainHint?: string }) {
  const router = useRouter();
  const [domain, setDomain] = useState(domainHint ?? "");

  function runFreeAudit() {
    trackEvent("proof_report_cta_clicked", {
      domain: domain.trim() || undefined,
      source: "proof_report",
    });
    const q = domain.trim()
      ? `?domain=${encodeURIComponent(domain.trim())}`
      : "";
    router.push(`/audit${q}`);
  }

  return (
    <section className="citepilot-no-print mt-10 rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/5 to-mint/5 p-8 print:hidden">
      <h2 className="font-display text-xl font-bold text-ink">
        Want to see your brand&apos;s citation score?
      </h2>
      <p className="mt-2 text-sm text-muted">
        Run a free GEO audit — see where ChatGPT, Perplexity, and Google AI cite you.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="yourdomain.com"
          className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink sm:max-w-xs"
        />
        <button
          type="button"
          onClick={runFreeAudit}
          className="shrink-0 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
        >
          Run a free audit →
        </button>
      </div>
    </section>
  );
}
