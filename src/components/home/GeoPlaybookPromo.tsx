import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductCTA } from "@/components/ui/ProductCTA";

const PLAYBOOK_HIGHLIGHTS = [
  {
    title: "Perplexity citation playbook",
    body: "8-step guide to structured data, OpenAPI schemas, llms.txt, and entity optimization.",
  },
  {
    title: "5 GEO frameworks",
    body: "RAG stack, ACE, CITE, Share of Model, and dual-track SEO + GEO.",
  },
  {
    title: "Interactive checklists",
    body: "7-day rollout plan with progress tracking — ship fixes this week.",
  },
] as const;

export function GeoPlaybookPromo() {
  return (
    <Section id="geo-playbook" className="bg-white">
      <div className="overflow-hidden rounded-3xl border border-accent/25 bg-gradient-to-br from-surface via-white to-accent/5 shadow-sm">
        <div className="grid gap-0 lg:grid-cols-2">
          <div className="border-b border-border p-8 sm:p-10 lg:border-b-0 lg:border-r">
            <SectionHeading
              eyebrow="Free resource"
              title="The complete GEO Playbook"
              description="Authoritative guides for money prompts, RAG citations, and Perplexity footnote optimization — not a thin lead magnet."
              align="left"
              headingLevel="h2"
            />
            <ul className="mt-8 space-y-4">
              {PLAYBOOK_HIGHLIGHTS.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span
                    className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent"
                    aria-hidden
                  >
                    ✓
                  </span>
                  <span>
                    <span className="font-display block text-sm font-bold text-ink">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted">
                      {item.body}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ProductCTA href="/geo-playbook" sublabel="35 min · interactive">
                Read the GEO Playbook
              </ProductCTA>
              <ProductCTA
                href="/chatgpt-prompts"
                variant="outline"
                sublabel="Workspace prompt loop"
                showArrow={false}
              >
                ChatGPT prompts guide
              </ProductCTA>
            </div>
          </div>

          <div className="flex flex-col justify-center p-8 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              Featured · Perplexity
            </p>
            <h3 className="font-display mt-2 text-xl font-bold text-ink sm:text-2xl">
              How Perplexity extracts citations
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Step-by-step: allow PerplexityBot, ship JSON-LD Organization and
              FAQPage schema, publish OpenAPI + llms.txt, align entity graphs
              across G2 and Crunchbase, and engineer answer capsules that survive
              ranking.
            </p>
            <Link
              href="/geo-playbook#geo-perplexity"
              className="mt-6 inline-flex text-sm font-semibold text-accent hover:underline"
            >
              Open the Perplexity playbook →
            </Link>
          </div>
        </div>
      </div>
    </Section>
  );
}
