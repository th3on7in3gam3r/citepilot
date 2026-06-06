import { Panel } from "@/components/dashboard/DashboardUI";
import Link from "next/link";

/** Server-rendered analytics hub overview for SEO and orientation. */
export function AnalyticsSeoIntro() {
  return (
    <Panel className="mt-10">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
        LLM visibility & organic analytics for GEO
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted md:text-base">
        CitePilot Analytics connects AI citation intelligence with organic search
        performance so you can prove what moved — not just report vanity scores.
        Toggle between Google Search Console trends and LLM prompt coverage to
        see how money prompts perform on ChatGPT, Perplexity, Google AI Overviews,
        and other generative surfaces over time.
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            LLM citation tracking & competitor benchmarks
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
            Export workspace JSON for agency reporting or open the{" "}
            <Link href="/report/proof" className="font-semibold text-accent">
              proof report
            </Link>{" "}
            for stakeholder-ready PDFs. Re-run audits from{" "}
            <Link href="/dashboard/geo-audit" className="font-semibold text-accent">
              GEO Audit
            </Link>{" "}
            or{" "}
            <Link href="/audit" className="font-semibold text-accent">
              the public audit tool
            </Link>{" "}
            after shipping fixes to refresh every chart on this page.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            Google Search Console & organic bridge
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
            Organic wins alone do not guarantee AI citations, but sustained
            clicks on answer-intent pages often precede generative mentions. Pair
            GSC trends with weekly rescans on Pilot+ to build a narrative for
            clients: what shipped, what moved in search, and what moved in LLM
            answers.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            Turning analytics into weekly action
          </h2>
          <p className="mt-2">
            Analytics is the measurement layer in the CitePilot loop. When a prompt
            drops, trace it in benchmark tables, generate a fix on{" "}
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
          <h3 className="mt-4 font-semibold text-ink">Analytics checklist</h3>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Audit 5–10 money prompts before trusting trend lines.</li>
            <li>Connect GSC when you need organic + AI visibility in one view.</li>
            <li>Export JSON or proof reports after each Monday re-scan.</li>
            <li>Investigate competitor benchmark rows before creating net-new blog volume.</li>
          </ul>
        </section>
      </div>
    </Panel>
  );
}
