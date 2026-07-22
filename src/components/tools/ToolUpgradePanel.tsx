import Link from "next/link";
import { PillButton } from "@/components/ui/PillButton";

export function ToolUpgradePanel({
  title = "Track citations weekly in your dashboard",
  description = "Set up a workspace to monitor money prompts across ChatGPT, Perplexity, and Google AI — with citation alerts and proof reports.",
  href = "/start",
  ctaLabel = "Start free setup →",
  secondaryHref,
  secondaryLabel,
}: {
  title?: string;
  description?: string;
  href?: string;
  ctaLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section className="tool-upgrade-panel mt-10 rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/8 via-white to-surface p-6 text-center shadow-sm md:p-8 dark:from-accent/12 dark:via-white/[0.04] dark:to-transparent">
      <p className="font-display text-lg font-bold text-ink dark:text-white md:text-xl">
        {title}
      </p>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted dark:text-white/65">
        {description}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <PillButton href={href} size="md">
          {ctaLabel}
        </PillButton>
        {secondaryHref && secondaryLabel ? (
          <Link
            href={secondaryHref}
            className="inline-flex min-h-11 items-center rounded-full border border-border px-6 text-sm font-semibold text-ink transition hover:border-accent/40 hover:text-accent dark:border-white/15 dark:text-white dark:hover:border-accent/40"
          >
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
