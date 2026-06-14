"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CitationDashboardMock } from "@/components/home/mockups/CitationDashboardMock";
import { Logo } from "@/components/ui/Logo";
import { testimonials } from "@/lib/testimonials";

const signUpQuote =
  testimonials.find((t) => t.verified) ?? testimonials[0]!;

export function AuthMarketingPanel() {
  const pathname = usePathname();
  const isSignUp = pathname?.includes("/sign-up");

  return (
    <div className="hidden lg:flex flex-col justify-between p-12 bg-cream min-h-[100dvh]">
      <Logo />

      {isSignUp ? (
        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Join CitePilot
          </p>
          <h2 className="font-display mt-3 text-4xl font-bold text-ink leading-tight">
            Start tracking your AI citation share
          </h2>
          <p className="mt-4 text-base text-muted">
            Teams use CitePilot to monitor money prompts across ChatGPT,
            Perplexity, and Google AI — then prove when citations move.
          </p>
          <figure className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-sm">
            <blockquote className="text-sm leading-relaxed text-ink/85">
              &ldquo;{signUpQuote.text}&rdquo;
            </blockquote>
            <figcaption className="mt-4 text-xs text-muted">
              <span className="font-semibold text-ink">{signUpQuote.author}</span>
              {" · "}
              {signUpQuote.role}
            </figcaption>
          </figure>
          <p className="mt-4 text-xs text-muted">
            From CitePilot customers — illustrative social proof, not paid endorsements.
          </p>
        </div>
      ) : (
        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Welcome back
          </p>
          <h2 className="font-display mt-3 text-4xl font-bold text-ink leading-tight">
            Pick up where your citations left off
          </h2>
          <p className="mt-4 text-base text-muted">
            Your last scan may have surfaced new competitor moves — sign in to
            see weekly deltas and prioritized fixes.
          </p>
          <div className="mt-6 rounded-2xl border border-border bg-white p-3 shadow-sm">
            <CitationDashboardMock embedded compact />
          </div>
          <p className="mt-4 text-sm font-medium text-ink">
            +3 competitor citations detected on your last weekly rescan
          </p>
          <p className="mt-1 text-xs text-muted">
            Example dashboard insight — actual data appears after your first audit.
          </p>
        </div>
      )}

      <Link
        href="/"
        className="text-sm font-medium text-muted hover:text-ink transition-colors"
      >
        ← Back to CitePilot
      </Link>
    </div>
  );
}
