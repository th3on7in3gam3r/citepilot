import Link from "next/link";
import { ExternalLink, Layers } from "lucide-react";
import { aiCmoStudioBillingUrl, aiCmoStudioHubUrl } from "@/lib/growth-stack";

export function StudioBundleCta() {
  return (
    <section className="mx-auto mt-14 max-w-4xl rounded-2xl border border-accent/25 bg-[linear-gradient(180deg,rgba(14,165,233,0.08),rgba(255,255,255,0.02))] p-6 md:p-8 dark:border-accent/30 dark:bg-[linear-gradient(180deg,rgba(14,165,233,0.12),rgba(255,255,255,0.03))]">
      <p className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-accent dark:text-glow">
        <Layers className="h-3.5 w-3.5" aria-hidden />
        Studio bundles
      </p>
      <h2 className="mt-3 text-center font-display text-xl font-bold text-foreground dark:text-white md:text-2xl">
        Pair CitePilot with AI CMO strategy — one checkout
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-muted dark:text-white/55">
        The <strong className="text-foreground dark:text-white">Growth Stack</strong> bundles CitePilot
        Pilot with AI CMO Pro. Agency teams: the <strong className="text-foreground dark:text-white">Studio Bundle</strong>{" "}
        adds Fleet + Team seats across the stack. Checkout on AI CMO; entitlements sync when you use the
        same email.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={aiCmoStudioBillingUrl("growth")}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm transition hover:opacity-90"
        >
          Growth Stack — CitePilot + AI CMO
          <ExternalLink className="h-4 w-4" aria-hidden />
        </Link>
        <Link
          href={aiCmoStudioBillingUrl("studio")}
          className="inline-flex items-center gap-2 rounded-full border border-accent/40 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-accent/60 dark:text-white"
        >
          Studio Bundle — Fleet + agency tools
          <ExternalLink className="h-4 w-4" aria-hidden />
        </Link>
        <Link
          href={aiCmoStudioHubUrl()}
          className="text-sm font-semibold text-accent hover:underline dark:text-glow"
        >
          Explore the studio hub
        </Link>
      </div>
    </section>
  );
}
