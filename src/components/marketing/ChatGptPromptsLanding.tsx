import Link from "next/link";
import { ChatGptPromptIntentExplorer } from "@/components/marketing/chatgpt-prompts/ChatGptPromptIntentExplorer";
import { Container } from "@/components/ui/Container";
import { ProductCTA } from "@/components/ui/ProductCTA";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  chatgptPromptsFaqs,
  chatgptPromptsLanding,
  workspacePromptLoop,
} from "@/lib/marketing/chatgpt-prompts-landing";

export function ChatGptPromptsLanding() {
  return (
    <>
      <section className="border-b border-border bg-gradient-to-br from-ink via-ink to-accent/30 pt-28 pb-16 text-white md:pt-32 md:pb-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
              Workspace strategy · ChatGPT
            </p>
            <h1 className="font-display mt-4 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
              {chatgptPromptsLanding.title}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-white/75 sm:text-lg">
              {chatgptPromptsLanding.description}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/start"
                className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:bg-white/90"
              >
                Start with your buyer question
              </Link>
              <Link
                href="/audit"
                className="inline-flex rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Run free ChatGPT audit
              </Link>
            </div>
          </div>

          <dl className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
            {[
              { label: "Prompt intents", value: "6" },
              { label: "Workspace phases", value: "5" },
              { label: "Re-scan cadence", value: "Weekly" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-center"
              >
                <dt className="text-xs font-medium uppercase tracking-wider text-white/60">
                  {stat.label}
                </dt>
                <dd className="font-display mt-1 text-2xl font-bold">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <Section className="bg-cream">
        <SectionHeading
          eyebrow="The problem"
          title="Google rank ≠ ChatGPT citation"
          description="Buyers ask ChatGPT specific questions at decision time. If your workspace isn't tracking those exact prompts, you're optimizing blind."
          align="center"
        />
        <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
          <blockquote className="rounded-2xl border border-border bg-white p-6 text-sm leading-relaxed text-muted shadow-sm">
            <strong className="text-ink">Traditional SEO</strong> reports keyword
            position and click-through. It cannot tell you if ChatGPT recommended
            your competitor on &ldquo;best [category] for [segment].&rdquo;
          </blockquote>
          <blockquote className="rounded-2xl border border-accent/30 bg-accent/5 p-6 text-sm leading-relaxed text-muted shadow-sm">
            <strong className="text-ink">CitePilot workspace</strong> binds every
            optimization to a monitored ChatGPT prompt — discover, baseline,
            prioritize, fix, and re-scan the same question until citation lifts.
          </blockquote>
        </div>
      </Section>

      <Section id="workspace-loop" className="bg-white">
        <SectionHeading
          eyebrow="Five-phase loop"
          title="How the workspace handles ChatGPT prompts"
          description="Each phase maps to a dashboard surface — from onboarding through proof reports."
          align="center"
        />
        <ol className="mx-auto mt-12 max-w-4xl space-y-6">
          {workspacePromptLoop.map((phase) => (
            <li
              key={phase.id}
              id={`phase-${phase.id}`}
              className="scroll-mt-28 overflow-hidden rounded-2xl border border-border bg-cream shadow-sm"
            >
              <div className="flex flex-col gap-4 border-b border-border bg-white px-6 py-5 sm:flex-row sm:items-start sm:gap-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent font-display text-lg font-bold text-white">
                  {phase.step}
                </span>
                <div>
                  <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">
                    {phase.title}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-accent">
                    {phase.subtitle}
                  </p>
                </div>
              </div>
              <div className="space-y-5 px-6 py-6">
                <p className="text-sm leading-relaxed text-muted">{phase.body}</p>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-ink">
                    In the workspace
                  </h3>
                  <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                    {phase.workspaceFeatures.map((f) => (
                      <li
                        key={f}
                        className="flex gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm text-muted"
                      >
                        <span className="text-accent" aria-hidden>
                          ✓
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-muted">
                  <strong className="text-ink">Outcome:</strong> {phase.outcome}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="prompt-intents" className="bg-cream">
        <SectionHeading
          eyebrow="Programmatic taxonomy"
          title="Six intent types — infinite prompt variants"
          description="CitePilot classifies every monitored prompt by buyer intent so fixes match how ChatGPT answers that question type."
          align="center"
        />
        <div className="mx-auto mt-10 max-w-5xl">
          <ChatGptPromptIntentExplorer />
        </div>
      </Section>

      <Section className="bg-white">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-surface via-white to-accent/5 p-8 shadow-sm sm:p-10">
          <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
            From one buyer question to a tracked prompt program
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
            Onboarding captures your seed question. The workspace programmatically
            expands it into alternatives, comparisons, pricing, and implementation
            prompts — the same patterns buyers actually type. Edit the list in
            Settings, import CSV on Fleet, or mine Discussions for new candidates.
            Every item stays tied to a ChatGPT re-scan so you never lose the thread
            between content shipped and citation gained.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ProductCTA href="/start" sublabel="5-step workspace setup">
              Configure prompts
            </ProductCTA>
            <ProductCTA
              href="/dashboard/analytics"
              variant="outline"
              sublabel="Per-prompt citation trends"
              showArrow={false}
            >
              See Analytics
            </ProductCTA>
            <ProductCTA
              href="/nurture"
              variant="outline"
              sublabel="RAG + money prompts"
              showArrow={false}
            >
              GEO Playbook
            </ProductCTA>
          </div>
        </div>
      </Section>

      <Section id="faq" className="bg-cream">
        <SectionHeading
          eyebrow="FAQ"
          title="ChatGPT prompt tracking"
          align="center"
        />
        <dl className="mx-auto mt-10 max-w-3xl space-y-4">
          {chatgptPromptsFaqs.map((faq) => (
            <div
              key={faq.q}
              className="rounded-2xl border border-border bg-white p-6 shadow-sm"
            >
              <dt className="font-display font-bold text-ink">{faq.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted">
                {faq.a}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <section className="border-t border-border bg-ink py-16 text-white md:py-20">
        <Container className="text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Track the ChatGPT prompts that drive pipeline
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-white/65">
            Baseline today. Re-scan weekly. Prove citation lift on the exact
            questions your buyers ask.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/audit"
              className="inline-flex rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-white transition hover:opacity-95"
            >
              Run free citation audit
            </Link>
            <Link
              href="/pricing"
              className="inline-flex rounded-full border border-white/25 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              View plans
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
