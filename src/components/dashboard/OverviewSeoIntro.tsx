import { Panel } from "@/components/dashboard/DashboardUI";
import Link from "next/link";

type OverviewSeoIntroProps = {
  /** `header` renders above the workspace UI; `footer` renders deep sections below it. */
  section?: "header" | "footer";
};

/** Server-rendered dashboard overview copy for SEO and orientation. */
export function OverviewSeoIntro({ section = "header" }: OverviewSeoIntroProps) {
  if (section === "footer") {
    return (
      <Panel className="mt-10">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 select-none">
            <span className="font-display text-sm font-semibold text-ink">
              Where to go next &amp; FAQ
            </span>
            <span className="text-xs text-muted transition-transform group-open:rotate-180" aria-hidden="true">
              ▾
            </span>
          </summary>
          <div className="mt-6 space-y-8 text-sm leading-relaxed text-muted">
            <section>
              <h2 className="font-display text-lg font-bold text-ink">
                Where to go next in CitePilot
              </h2>
              <p className="mt-2">
                Drill into{" "}
                <Link href="/dashboard/analytics" className="font-semibold text-accent">
                  Analytics
                </Link>{" "}
                for LLM benchmarks and Search Console,{" "}
                <Link href="/dashboard/geo-audit" className="font-semibold text-accent">
                  GEO Audit
                </Link>{" "}
                for technical site signals,{" "}
                <Link href="/dashboard/content" className="font-semibold text-accent">
                  Content
                </Link>{" "}
                for gap-driven articles,{" "}
                <Link href="/dashboard/backlinks" className="font-semibold text-accent">
                  Backlinks
                </Link>{" "}
                for authority placements, and{" "}
                <Link href="/report/proof" className="font-semibold text-accent">
                  Proof report
                </Link>{" "}
                for stakeholder exports. The overview answers one question every
                Monday: did citation share move on the prompts that matter?
              </p>
              <p className="mt-2">
                New to GEO? Start with the{" "}
                <Link href="/nurture" className="font-semibold text-accent">
                  GEO Playbook
                </Link>
                , map buyer intent via{" "}
                <Link href="/chatgpt-prompts" className="font-semibold text-accent">
                  ChatGPT money prompts
                </Link>
                , or run the{" "}
                <Link href="/audit" className="font-semibold text-accent">
                  free 60-second citation audit
                </Link>{" "}
                before creating a workspace.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-ink">
                Weekly monitoring and proof workflows
              </h2>
              <p className="mt-2">
                Pilot+ enables Monday rescans, citation delta chips, Autopilot
                action plans, and proof report emails. Configure monitoring
                preferences in{" "}
                <Link href="/dashboard/settings" className="font-semibold text-accent">
                  Settings
                </Link>{" "}
                before enabling weekly digests or competitor-move alerts. Fleet
                customers can white-label proof exports for agency clients.
              </p>
              <h3 className="mt-4 font-semibold text-ink">Overview checklist</h3>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Confirm executive briefing grade matches your latest audit.</li>
                <li>Review alert center items before planning the week.</li>
                <li>Copy one new money prompt into your next re-scan.</li>
                <li>Export proof report after meaningful citation lift.</li>
              </ul>
            </section>

            <section aria-labelledby="overview-faq">
              <h2
                id="overview-faq"
                className="font-display text-lg font-bold text-ink"
              >
                GEO citation dashboard FAQ
              </h2>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="font-semibold text-ink">
                    What does the citation score measure?
                  </dt>
                  <dd className="mt-1">
                    A blended score from GEO technical readiness and the share of
                    monitored money prompts where your brand is cited on AI answer
                    surfaces. It updates after each audit or Monday rescan.
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink">
                    Why are some dashboard tiles empty?
                  </dt>
                  <dd className="mt-1">
                    Run your first audit from the overview button or the public
                    audit tool to populate platform presence, scan deltas, and
                    citation volume charts with live data.
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink">
                    How do money prompt suggestions work?
                  </dt>
                  <dd className="mt-1">
                    CitePilot generates buyer-intent questions from your domain,
                    niche, and competitors. Copy suggestions into audits, Content,
                    or Discussions research to expand monitored prompt coverage.
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        </details>
      </Panel>
    );
  }

  return (
    <Panel className="mb-8">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
          Citation Dashboard
        </h1>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent-deep">
          ✦ GEO Overview
        </span>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        Your command center for AI citation tracking — citation score, platform presence,
        money-prompt wins &amp; gaps, and prioritized weekly actions.
      </p>

      <details className="group mt-5">
        <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-muted hover:text-accent select-none transition-colors">
          <span className="transition-transform group-open:rotate-90" aria-hidden="true">▶</span>
          How does the dashboard work?
        </summary>
        <div className="mt-4 space-y-6 text-sm leading-relaxed text-muted border-l-2 border-border pl-4">
          <section>
            <h2 className="font-display text-base font-bold text-ink">
              Executive briefing and citation health scores
            </h2>
            <p className="mt-2">
              The executive briefing card summarizes domain context, strategic
              focus, and a letter-grade citation ring with money-prompt cited
              counts. Stat tiles track citation score out of 100, platforms cited,
              prompts monitored, and community signals from buyer discussions.
              Scan delta chips highlight prompt wins, losses, and new gaps since
              your previous audit — the fastest way to know if last week&apos;s
              fixes worked.
            </p>
            <p className="mt-2">
              Citation volume charts plot visibility index over time when multiple
              audits exist. Compare trends in{" "}
              <Link href="/dashboard/analytics" className="font-semibold text-accent">
                Analytics
              </Link>{" "}
              after each rescan to confirm lift on specific prompts.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base font-bold text-ink">
              Alerts, platform presence, and money prompts
            </h2>
            <p className="mt-2">
              The alert center prioritizes competitor movement, stale audits, missing
              platform coverage, and proof-report opportunities. Platform presence
              lists each AI surface — ChatGPT, Perplexity, Gemini, Copilot, and
              more — with cited or missing status per your latest run. Money prompt
              suggestions generate buyer-intent questions from your domain, niche,
              and competitor set; copy them into audits, Content, or{" "}
              <Link href="/dashboard/discussions" className="font-semibold text-accent">
                Discussions
              </Link>{" "}
              research.
            </p>
            <p className="mt-2">
              Weekly actions and Copilot insights rank gap fixes by impact. Pilot+
              users get full explain-gap and prioritize flows; Free workspaces
              receive a teaser insight after the first real audit.
            </p>
          </section>

          <p className="text-xs">
            New user?{" "}
            <Link href="/start" className="font-semibold text-accent">
              Start analysis
            </Link>{" "}
            or run the{" "}
            <Link href="/audit" className="font-semibold text-accent">
              free citation audit
            </Link>{" "}
            to populate live metrics instead of projections.
          </p>
        </div>
      </details>
    </Panel>
  );
}
