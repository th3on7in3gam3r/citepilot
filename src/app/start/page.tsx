import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { getSessionUserId } from "@/lib/auth/server";
import { stepMeta } from "@/lib/onboarding";
import { countWorkspacesForUser } from "@/lib/server/workspace";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Start GEO & AI Citation Analysis",
  description:
    "Start your free GEO citation analysis in minutes. Add your domain, money prompts, and competitors — get audited on ChatGPT, Perplexity & AI Overviews.",
};

export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ full?: string }>;
}) {
  const params = await searchParams;
  const userId = await getSessionUserId();

  if (userId && params.full !== "1") {
    const count = await countWorkspacesForUser(userId);
    if (count > 0) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="min-h-[100dvh] bg-cream">
      <section className="border-b border-border bg-white px-6 py-6 md:px-10 lg:px-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl">
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
              Start your GEO & AI citation analysis
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted md:text-base">
              Set up your workspace in five quick steps. We audit where ChatGPT,
              Perplexity, and AI Overviews cite you on money prompts — then
              prioritize fixes that move pipeline.
            </p>
          </div>
          <nav
            className="max-w-xl lg:max-w-md lg:pt-1"
            aria-label="Citation analysis setup steps"
          >
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              What you&apos;ll configure
            </h2>
            <ol className="mt-3 space-y-3">
              {stepMeta.map((step, index) => (
                <li key={step.id}>
                  <h3 className="text-sm font-semibold text-ink">
                    {index + 1}. {step.title}
                  </h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">
                    {step.subtitle}
                  </p>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </section>
      <OnboardingFlow />
    </div>
  );
}
