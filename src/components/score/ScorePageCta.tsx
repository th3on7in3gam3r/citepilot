"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ONBOARDING_EXIT_EMAIL_KEY } from "@/components/onboarding/OnboardingExitIntent";
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
    <section className="rounded-3xl bg-accent p-8 text-white shadow-lg md:p-10">
      <h2 className="font-display text-2xl font-bold md:text-3xl">
        Is this your domain? Get your full citation report — free.
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80">
        See every money prompt, platform-by-platform breakdown, and a prioritized
        fix list — not just the headline score.
      </p>
      <form
        onSubmit={runFreeAudit}
        className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/50 backdrop-blur-sm focus:border-white/40 focus:outline-none sm:max-w-sm"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-accent transition hover:bg-white/90"
        >
          Run free audit →
        </button>
      </form>
    </section>
  );
}
