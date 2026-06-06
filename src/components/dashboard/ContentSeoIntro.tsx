import { Panel } from "@/components/dashboard/DashboardUI";
import Link from "next/link";

type ContentSeoIntroProps = {
  /** `header` renders above the workspace UI; `footer` renders deep sections below it. */
  section?: "header" | "footer";
};

/** Server-rendered content hub overview for SEO and orientation. */
export function ContentSeoIntro({ section = "header" }: ContentSeoIntroProps) {
  if (section === "footer") {
    return (
      <Panel className="mt-10">
        <div className="space-y-8 text-sm leading-relaxed text-muted">
          <section>
            <h2 className="font-display text-lg font-bold text-ink">
              CMS publishing and the citation feedback loop
            </h2>
            <p className="mt-2">
              Connect Webflow, WordPress, Ghost, Shopify, or Framer to push
              approved articles from the queue directly to your site. Publishing is
              deliberate — nothing auto-goes live without your review — so you
              stay in control of brand voice and factual claims. After publish,
              re-run a GEO audit from{" "}
              <Link href="/dashboard/geo-audit" className="font-semibold text-accent">
                GEO Audit
              </Link>{" "}
              or{" "}
              <Link href="/dashboard" className="font-semibold text-accent">
                Overview
              </Link>{" "}
              to measure whether citation rate moved on the prompts you targeted.
            </p>
            <p className="mt-2">
              Field mapping, provider quirks, and draft-vs-live behavior are
              documented in the{" "}
              <Link href="/help/cms-publishing" className="font-semibold text-accent">
                CMS publishing guide
              </Link>
              . Pilot and Fleet unlock full publish workflows; Free workspaces can
              preview generation and upgrade when ready to ship weekly.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-ink">
              Related workspace tools
            </h2>
            <p className="mt-2">
              Content works best alongside prompt monitoring in{" "}
              <Link href="/dashboard/analytics" className="font-semibold text-accent">
                Analytics
              </Link>
              , technical fixes from{" "}
              <Link href="/dashboard/geo-audit" className="font-semibold text-accent">
                GEO Audit
              </Link>
              , and stakeholder proof from{" "}
              <Link href="/report/proof" className="font-semibold text-accent">
                Proof report
              </Link>
              . Map buyer intent with the{" "}
              <Link href="/chatgpt-prompts" className="font-semibold text-accent">
                ChatGPT money prompts guide
              </Link>{" "}
              or deepen GEO strategy in the{" "}
              <Link href="/nurture" className="font-semibold text-accent">
                GEO Playbook
              </Link>
              .
            </p>
            <h3 className="mt-4 font-semibold text-ink">Content workflow checklist</h3>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>
                Audit money prompts and note gaps where competitors are cited
                instead of you.
              </li>
              <li>
                Generate one article per high-impact gap — comparison or direct
                answer format.
              </li>
              <li>Publish to CMS, then rescan within seven days to confirm lift.</li>
              <li>Refresh the 30-day calendar after major audit changes.</li>
            </ul>
          </section>

          <section aria-labelledby="content-faq">
            <h2
              id="content-faq"
              className="font-display text-lg font-bold text-ink"
            >
              GEO content workspace FAQ
            </h2>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="font-semibold text-ink">
                  How does CitePilot pick calendar topics?
                </dt>
                <dd className="mt-1">
                  The 30-day calendar ranks topics by citation gap impact from your
                  latest audit — comparison angles, answer guides, and FAQ hubs
                  that are most likely to move share on monitored money prompts.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">
                  What article formats work best for AI citations?
                </dt>
                <dd className="mt-1">
                  Direct-answer pages, structured comparisons, and FAQ hubs with
                  extractable summaries and question-style headings. Briefs
                  emphasize schema-friendly patterns LLMs prefer when selecting
                  sources.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">
                  Which CMS platforms are supported?
                </dt>
                <dd className="mt-1">
                  Webflow, WordPress, Ghost, Shopify, and Framer. Connect from the
                  CMS panel in the workspace below, map fields once, then publish
                  approved drafts from your article queue.
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </Panel>
    );
  }

  return (
    <Panel className="mb-10">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
        GEO content strategy and publishing
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted md:text-base">
        The CitePilot content workspace turns citation audit gaps into branded
        articles, editorial calendars, and CMS publishes that help you get cited
        in ChatGPT, Perplexity, Google AI Overviews, and other generative answer
        surfaces. Instead of generic AI blog volume, every piece is tied to money
        prompts — the buyer questions that actually drive pipeline.
      </p>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted md:text-base">
        Use the panels below to generate SEO articles, manage your publishing
        queue, connect a CMS, and review your workspace 30-day calendar. New
        teams can baseline gaps with the{" "}
        <Link href="/audit" className="font-semibold text-accent">
          free citation audit
        </Link>{" "}
        before upgrading to Pilot for weekly generation and publish workflows.
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            Branded SEO articles from audit gaps
          </h2>
          <p className="mt-2">
            Use the article generator to draft comparison pages, answer guides,
            FAQ hubs, and pillar content aligned to your domain, niche, and
            competitor set. Briefs emphasize extractable summaries, question-style
            headings, and structured data patterns that LLMs prefer when selecting
            citations. Generated drafts land in your article queue where you can
            review, edit, and publish without leaving the dashboard.
          </p>
          <p className="mt-2">
            Pilot and Fleet plans unlock ongoing generation and CMS publishing.
            Free workspaces can explore the workflow and upgrade on{" "}
            <Link href="/pricing" className="font-semibold text-accent">
              pricing
            </Link>{" "}
            when they are ready to ship content weekly against monitored prompts.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            30-day content calendar and editorial mix
          </h2>
          <p className="mt-2">
            After a citation audit, CitePilot builds a workspace-specific 30-day
            calendar ranked by gap impact: which topics, formats, and comparison
            angles are most likely to move citation share on your top prompts. The
            calendar persists across rescans so you can track what shipped versus
            what is still open from the latest audit.
          </p>
          <p className="mt-2">
            The editorial mix panel shows CitePilot&apos;s own site cadence across
            GEO, technical SEO, local, paid, and agency pillars — a reference for
            how to balance educational content with conversion-ready pages. Adapt
            the rhythm to your brand, but keep answer capsules and comparison
            intent at the center of the plan.
          </p>
        </section>
      </div>
    </Panel>
  );
}
