import { Panel } from "@/components/dashboard/DashboardUI";
import Link from "next/link";

/** Server-rendered dashboard overview copy for SEO and orientation. */
export function OverviewSeoIntro() {
  return (
    <Panel className="mt-10">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
        GEO citation dashboard overview
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted md:text-base">
        The CitePilot dashboard overview is your command center for generative
        engine optimization: citation score, platform presence, money-prompt
        tracking, and prioritized weekly actions. Everything here updates from
        your latest GEO audit and Monday rescans on Pilot+ — so you see whether
        ChatGPT, Perplexity, and AI Overviews actually cite your brand on
        buyer-intent questions.
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            Executive briefing & citation health scores
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
            audits exist. If you just onboarded, run a free audit from the
            button above or visit{" "}
            <Link href="/audit" className="font-semibold text-accent">
              the public audit tool
            </Link>{" "}
            to populate live data instead of projections.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            Alerts, platform presence & money prompts
          </h2>
          <p className="mt-2">
            The alert center prioritizes competitor movement, stale audits,
            missing platform coverage, and proof-report opportunities. Platform
            presence lists each AI surface — ChatGPT, Perplexity, Gemini, Copilot,
            and more — with cited or missing status per your latest run. Money
            prompt suggestions generate buyer-intent questions from your domain,
            niche, and competitor set; copy them into audits,{" "}
            <Link href="/dashboard/content" className="font-semibold text-accent">
              Content
            </Link>
            , or{" "}
            <Link href="/dashboard/discussions" className="font-semibold text-accent">
              Discussions
            </Link>{" "}
            research.
          </p>
          <p className="mt-2">
            Weekly actions and Copilot insights rank gap fixes by impact. Pilot+
            users get full explain-gap and prioritize flows; Free workspaces
            receive a teaser insight after the first real audit. Configure
            monitoring email and alert toggles in{" "}
            <Link href="/dashboard/settings" className="font-semibold text-accent">
              Settings
            </Link>{" "}
            before enabling weekly digests or proof report delivery.
          </p>
        </section>

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
            <Link href="/dashboard/backlinks" className="font-semibold text-accent">
              Backlinks
            </Link>{" "}
            for authority placements, and{" "}
            <Link href="/report/proof" className="font-semibold text-accent">
              Proof report
            </Link>{" "}
            for stakeholder exports. The overview is designed to answer one
            question every Monday: did citation share move on the prompts that
            matter?
          </p>
          <h3 className="mt-4 font-semibold text-ink">Overview checklist</h3>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Confirm executive briefing grade matches your latest audit.</li>
            <li>Review alert center items before planning the week.</li>
            <li>Copy one new money prompt into your next re-scan.</li>
            <li>Export proof report after meaningful citation lift.</li>
          </ul>
        </section>
      </div>
    </Panel>
  );
}
