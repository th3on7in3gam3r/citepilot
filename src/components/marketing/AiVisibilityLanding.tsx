import Link from "next/link";
import { AeoGeoCompare } from "@/components/marketing/ai-visibility/AeoGeoCompare";
import { VisibilityMetricsMap } from "@/components/marketing/ai-visibility/VisibilityMetricsMap";
import { Container } from "@/components/ui/Container";
import { ProductCTA } from "@/components/ui/ProductCTA";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  aiVisibilityFaqs,
  aiVisibilityLanding,
  schemaDeploymentPipeline,
} from "@/lib/marketing/ai-visibility-landing";

export function AiVisibilityLanding() {
  return (
    <>
      <section className="border-b border-border bg-gradient-to-br from-ink via-[#0f172a] to-accent/40 pt-28 pb-16 text-white md:pt-32 md:pb-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
              Service · AI visibility
            </p>
            <h1 className="font-display mt-4 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
              {aiVisibilityLanding.title}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-white/75 sm:text-lg">
              {aiVisibilityLanding.description}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/audit"
                className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:bg-white/90"
              >
                Baseline your metrics
              </Link>
              <Link
                href="/dashboard/geo-audit"
                className="inline-flex rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Open GEO Audit
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <Section id="metrics" className="bg-cream">
        <SectionHeading
          eyebrow="Metric map"
          title="AI visibility metrics in one workspace"
          description="Every metric ties to a dashboard surface — no vanity aggregates disconnected from money prompts."
          align="center"
        />
        <div className="mx-auto mt-12 max-w-5xl">
          <VisibilityMetricsMap />
        </div>
      </Section>

      <Section id="aeo-geo" className="bg-white">
        <SectionHeading
          eyebrow="Principles"
          title="AEO vs GEO — and how CitePilot spans both"
          description="Answer Engine Optimization and Generative Engine Optimization overlap but optimize different layers. Use the toggle to focus your team's language."
          align="center"
        />
        <div className="mx-auto mt-10 max-w-5xl">
          <AeoGeoCompare />
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted">
          <strong className="text-ink">Rule of thumb:</strong> AEO asks &ldquo;Are we the
          answer?&rdquo; GEO asks &ldquo;Are we retrieved, trusted, and cited in the
          synthesis?&rdquo; CitePilot measures both on the same prompt inventory.
        </p>
      </Section>

      <Section id="schema" className="bg-cream">
        <SectionHeading
          eyebrow="Automated schema deployment"
          title="Audit → prioritize → generate → publish"
          description="Close the loop from missing JSON-LD to live schema-backed URLs — without losing prompt-level accountability."
          align="center"
        />
        <ol className="mx-auto mt-12 max-w-4xl space-y-5">
          {schemaDeploymentPipeline.map((phase) => (
            <li
              key={phase.id}
              className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
            >
              <div className="flex items-start gap-4 border-b border-border bg-surface/50 px-6 py-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent font-display text-sm font-bold text-white">
                  {phase.step}
                </span>
                <h2 className="font-display text-lg font-bold text-ink sm:text-xl">
                  {phase.title}
                </h2>
              </div>
              <div className="space-y-4 px-6 py-5">
                <p className="text-sm leading-relaxed text-muted">{phase.body}</p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {phase.automations.map((item) => (
                    <li
                      key={item}
                      className="flex gap-2 rounded-lg border border-border bg-cream px-3 py-2 text-xs text-muted"
                    >
                      <span className="text-accent">⚡</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
        <div className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-3">
          <ProductCTA href="/dashboard/content" sublabel="Schema-ready articles">
            Content queue
          </ProductCTA>
          <ProductCTA
            href="/help/cms-publishing"
            variant="outline"
            sublabel="Webflow · WordPress · more"
            showArrow={false}
          >
            CMS publishing
          </ProductCTA>
        </div>
      </Section>

      <Section className="bg-white">
        <div className="mx-auto max-w-4xl rounded-3xl border border-accent/25 bg-gradient-to-br from-accent/5 via-white to-surface p-8 sm:p-10">
          <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
            One service, three proof points
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Measure",
                body: "Citation score, SoM, platform presence, GEO technical score.",
              },
              {
                title: "Align",
                body: "AEO answer craft + GEO retrieval schema on the same prompts.",
              },
              {
                title: "Deploy",
                body: "Autopilot actions → CMS publish → weekly re-scan proof.",
              },
            ].map((item) => (
              <li
                key={item.title}
                className="rounded-2xl border border-border bg-white p-5 shadow-sm"
              >
                <p className="font-display font-bold text-accent">{item.title}</p>
                <p className="mt-2 text-sm text-muted">{item.body}</p>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <ProductCTA href="/start">Start workspace</ProductCTA>
            <ProductCTA href="/pricing" variant="outline" showArrow={false}>
              View pricing
            </ProductCTA>
            <ProductCTA
              href="/chatgpt-prompts"
              variant="outline"
              sublabel="Prompt identification"
              showArrow={false}
            >
              ChatGPT prompts
            </ProductCTA>
          </div>
        </div>
      </Section>

      <Section id="faq" className="bg-cream">
        <SectionHeading eyebrow="FAQ" title="AI visibility service" align="center" />
        <dl className="mx-auto mt-10 max-w-3xl space-y-4">
          {aiVisibilityFaqs.map((faq) => (
            <div
              key={faq.q}
              className="rounded-2xl border border-border bg-white p-6 shadow-sm"
            >
              <dt className="font-display font-bold text-ink">{faq.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <section className="border-t border-border bg-ink py-16 text-white md:py-20">
        <Container className="text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Deploy AI visibility with measurable schema lift
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-white/65">
            Baseline metrics today. Automate schema-backed publishing. Prove citation
            lift on the prompts that matter.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/audit"
              className="inline-flex rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-white transition hover:opacity-95"
            >
              Run free citation audit
            </Link>
            <Link
              href="/nurture"
              className="inline-flex rounded-full border border-white/25 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Read GEO Playbook
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
