import { Panel } from "@/components/dashboard/DashboardUI";
import Link from "next/link";

/** Server-rendered content hub overview for SEO and orientation. */
export function ContentSeoIntro() {
  return (
    <Panel className="mt-10">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
        GEO content strategy & publishing
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted md:text-base">
        The CitePilot content workspace turns citation audit gaps into branded
        articles, editorial calendars, and CMS publishes that help you get cited in
        ChatGPT, Perplexity, Google AI Overviews, and other generative answer
        surfaces. Instead of generic AI blog volume, every piece is tied to money
        prompts — the buyer questions that actually drive pipeline.
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            Branded SEO articles from audit gaps
          </h2>
          <p className="mt-2">
            Use the article generator to draft comparison pages, answer guides, FAQ
            hubs, and pillar content aligned to your domain, niche, and competitor
            set. Briefs emphasize extractable summaries, question-style headings,
            and structured data patterns that LLMs prefer when selecting citations.
            Generated drafts land in your article queue where you can review,
            edit, and publish without leaving the dashboard.
          </p>
          <p className="mt-2">
            Pilot and Fleet plans unlock ongoing generation and CMS publishing.
            Free workspaces can explore the workflow and upgrade when they are
            ready to ship content weekly against monitored prompts.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            30-day content calendar & editorial mix
          </h2>
          <p className="mt-2">
            After a citation audit, CitePilot builds a workspace-specific 30-day
            calendar ranked by gap impact: which topics, formats, and comparison
            angles are most likely to move citation share on your top prompts.
            The calendar persists across rescans so you can track what shipped
            versus what is still open from the latest audit.
          </p>
          <p className="mt-2">
            The editorial mix panel shows CitePilot&apos;s own site cadence across
            GEO, technical SEO, local, paid, and agency pillars — a reference for
            how to balance educational content with conversion-ready pages. Adapt
            the rhythm to your brand, but keep answer capsules and comparison
            intent at the center of the plan.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            CMS publishing & citation loop
          </h2>
          <p className="mt-2">
            Connect Webflow, WordPress, Ghost, Shopify, or Framer to push approved
            articles from the queue directly to your site. Publishing is deliberate
            — nothing auto-goes live without your review — so you stay in control
            of brand voice and factual claims. After publish, re-run a GEO audit
            from{" "}
            <Link href="/dashboard/geo-audit" className="font-semibold text-accent">
              GEO Audit
            </Link>{" "}
            or Overview to measure whether citation rate moved on the prompts you
            targeted.
          </p>
          <h3 className="mt-4 font-semibold text-ink">Recommended workflow</h3>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Audit money prompts and note gaps where competitors are cited instead of you.</li>
            <li>Generate one article per high-impact gap — comparison or direct answer format.</li>
            <li>Publish to CMS, then rescan within seven days to confirm lift.</li>
            <li>Refresh the 30-day calendar after major audit changes.</li>
          </ul>
          <p className="mt-4">
            Need CMS field mapping help? See the{" "}
            <Link href="/help/cms-publishing" className="font-semibold text-accent">
              CMS publishing guide
            </Link>{" "}
            or visit{" "}
            <Link href="/dashboard/help" className="font-semibold text-accent">
              Help
            </Link>{" "}
            for workflows on monitoring, alerts, and proof reports.
          </p>
        </section>
      </div>
    </Panel>
  );
}
