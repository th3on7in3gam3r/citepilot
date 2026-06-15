"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CitationDashboardMock } from "@/components/home/mockups/CitationDashboardMock";
import { Logo } from "@/components/ui/Logo";
import { testimonials } from "@/lib/data/testimonials";

const signUpQuote =
  testimonials.find((t) => t.verified) ?? testimonials[0]!;

export function AuthMarketingPanel() {
  const pathname = usePathname();
  const isSignUp = pathname?.includes("/sign-up");

  return (
    <div className="hidden min-h-[100dvh] flex-col justify-between bg-cream p-12 lg:flex dark:border-r dark:border-[#222]">
      <Logo />

      {isSignUp ? (
        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Join CitePilot
          </p>
          <h2 className="font-display mt-3 text-4xl font-bold leading-tight text-ink">
            Start tracking your AI citation share
          </h2>
          <p className="mt-4 text-base text-muted">
            Teams use CitePilot to monitor money prompts across ChatGPT,
            Perplexity, and Google AI — then prove when citations move.
          </p>
          <figure className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm dark:border-[#222] dark:bg-[#111]">
            <blockquote className="text-sm leading-relaxed text-foreground/85">
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
          <h2 className="font-display mt-3 text-4xl font-bold leading-tight text-ink">
            Pick up where your citations left off
          </h2>
          <p className="mt-4 text-base text-muted">
            Your last scan may have surfaced new competitor moves — sign in to
            see weekly deltas and prioritized fixes.
          </p>
          <div className="mt-6 rounded-2xl border border-border bg-card p-3 shadow-sm dark:border-[#222] dark:bg-[#111]">
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
        className="text-sm font-medium text-muted transition-colors hover:text-ink"
      >
        ← Back to CitePilot
      </Link>
    </div>
  );
}
