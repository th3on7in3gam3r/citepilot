"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ONBOARDING_EXIT_EMAIL_KEY } from "@/components/onboarding/OnboardingExitIntent";
import { PillButtonAction } from "@/components/ui/PillButton";
import { trackEvent } from "@/lib/analytics/track";

export function ScorePageCta({ domain }: { domain: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");

  function runFreeAudit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (trimmedEmail) {
      try {
        localStorage.setItem(ONBOARDING_EXIT_EMAIL_KEY, trimmedEmail);
      } catch {
        // localStorage unavailable
      }
    }
    trackEvent("score_page_cta_clicked", {
      domain,
      has_email: Boolean(trimmedEmail),
    });
    router.push(`/start?domain=${encodeURIComponent(domain)}`);
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-accent/25 bg-gradient-to-br from-ink via-ink to-accent/40 p-8 text-white shadow-lg md:p-10">
      <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
        Full citation report
      </p>
      <h2 className="font-display mt-2 text-2xl font-bold md:text-3xl">
        Is this your domain? See every money prompt and fix list — free.
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75">
        Set up a workspace for platform-by-platform breakdowns and prioritized
        remediation — not just the headline score.
      </p>
      <form
        onSubmit={runFreeAudit}
        className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email (optional)"
          className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/50 backdrop-blur-sm focus:border-white/40 focus:outline-none sm:max-w-sm"
        />
        <PillButtonAction type="submit" variant="light" className="shrink-0">
          Start free setup →
        </PillButtonAction>
      </form>
    </section>
  );
}
