import { Panel } from "@/components/dashboard/DashboardUI";
import Link from "next/link";

type AnalyticsSeoIntroProps = {
  /** `header` renders above the workspace UI; `footer` renders deep sections below it. */
  section?: "header" | "footer";
};

/** Server-rendered analytics hub overview for SEO and orientation. */
export function AnalyticsSeoIntro({ section = "header" }: AnalyticsSeoIntroProps) {
  if (section === "footer") {
    return (
      <Panel className="mt-10">
        <div className="space-y-8 text-sm leading-relaxed text-muted">
          <section>
            <h2 className="font-display text-lg font-bold text-ink">
              Turning analytics into weekly action
            </h2>
            <p className="mt-2">
              Analytics is the measurement layer in the CitePilot loop. When a
              prompt drops, trace it in benchmark tables, generate a fix on{" "}
              <Link href="/dashboard/content" className="font-semibold text-accent">
                Content
              </Link>
              , earn supporting mentions on{" "}
              <Link href="/dashboard/backlinks" className="font-semibold text-accent">
                Backlinks
              </Link>
              , and confirm recovery here within seven days. Configure alerts in{" "}
              <Link href="/dashboard/settings" className="font-semibold text-accent">
                Settings
              </Link>{" "}
              for score drops, competitor moves, and proof report emails.
            </p>
            <p className="mt-2">
              Export workspace JSON for agency reporting or open the{" "}
              <Link href="/report/proof" className="font-semibold text-accent">
                proof report
              </Link>{" "}
              for stakeholder-ready PDFs. Fleet customers can white-label exports
              from Settings when delivering citation proof to clients.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-ink">
              Related workspace tools
            </h2>
            <p className="mt-2">
              Refresh charts after every audit from{" "}
              <Link href="/dashboard/geo-audit" className="font-semibold text-accent">
                GEO Audit
              </Link>{" "}
              or the{" "}
              <Link href="/audit" className="font-semibold text-accent">
                public citation audit
              </Link>
              . Compare AEO vs GEO metric definitions on the{" "}
              <Link href="/ai-visibility" className="font-semibold text-accent">
                AI visibility
              </Link>{" "}
              page, and review executive summaries on{" "}
              <Link href="/dashboard" className="font-semibold text-accent">
                Overview
              </Link>
              .
            </p>
            <h3 className="mt-4 font-semibold text-ink">Analytics checklist</h3>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Audit 5–10 money prompts before trusting trend lines.</li>
              <li>Connect GSC when you need organic + AI visibility in one view.</li>
              <li>Export JSON or proof reports after each Monday re-scan.</li>
              <li>
                Investigate competitor benchmark rows before creating net-new blog
                volume.
              </li>
            </ul>
          </section>

          <section aria-labelledby="analytics-faq">
            <h2
              id="analytics-faq"
              className="font-display text-lg font-bold text-ink"
            >
              LLM analytics workspace FAQ
            </h2>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="font-semibold text-ink">
                  What is share of model?
                </dt>
                <dd className="mt-1">
                  The percentage of your monitored money prompts where your brand
                  is cited versus competitors on AI answer surfaces. Benchmark
                  tables rank which prompts need defense or gap-closing content.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">
                  How do I connect Google Search Console?
                </dt>
                <dd className="mt-1">
                  Open the Google tab in the analytics workspace below and
                  authorize Search Console for your workspace domain. Organic
                  clicks and impressions appear alongside LLM citation metrics
                  when the property matches.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">
                  How often do analytics update?
                </dt>
                <dd className="mt-1">
                  LLM charts refresh from your latest audit and Monday rescans on
                  Pilot+. Run a manual audit from GEO Audit after major publishes
                  to update prompt-level visibility immediately.
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
        LLM visibility and organic analytics for GEO
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted md:text-base">
        CitePilot Analytics connects AI citation intelligence with organic search
        performance so you can prove what moved — not just report vanity scores.
        Toggle between Google Search Console trends and LLM prompt coverage to
        see how money prompts perform on ChatGPT, Perplexity, Google AI Overviews,
        and other generative surfaces over time.
      </p>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted md:text-base">
        Charts and benchmarks load in the workspace below once your domain is
        audited. New teams can baseline with the{" "}
        <Link href="/audit" className="font-semibold text-accent">
          free citation audit
        </Link>{" "}
        before enabling Pilot weekly rescans for automatic delta tracking.
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            LLM citation tracking and competitor benchmarks
          </h2>
          <p className="mt-2">
            The LLMs tab shows prompt-level visibility from your latest audits:
            which buyer questions cite your brand, which platforms mention you, and
            where competitors lead. Competitor benchmark cards rank share of model
            on high-intent prompts so you know whether to defend a lead or attack
            a gap with comparison content. Correlation insights tie technical
            signals — FAQ schema, entity markup, answer formatting — to likely
            citation lift when data supports it.
          </p>
          <p className="mt-2">
            Re-run audits from GEO Audit or the public audit tool after shipping
            fixes to refresh every chart on this page.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            Google Search Console and organic bridge
          </h2>
          <p className="mt-2">
            Connect Search Console to layer clicks, impressions, and average
            position alongside citation metrics. CitePilot highlights when organic
            movement aligns with AI visibility changes — useful for teams that
            still report SEO KPIs while migrating focus to GEO. Use the Google ·
            Live toggle at the top of the workspace card to switch views without
            losing prompt context.
          </p>
          <p className="mt-2">
            Organic wins alone do not guarantee AI citations, but sustained clicks
            on answer-intent pages often precede generative mentions. Pair GSC
            trends with weekly rescans on Pilot+ to build a narrative for clients:
            what shipped, what moved in search, and what moved in LLM answers.
          </p>
        </section>
      </div>
    </Panel>
  );
}
