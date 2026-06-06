import { Panel } from "@/components/dashboard/DashboardUI";
import Link from "next/link";

type SettingsSeoIntroProps = {
  /** `header` renders above the form; `footer` renders deep sections below it. */
  section?: "header" | "footer";
};

/** Server-rendered settings overview for SEO and first-time orientation. */
export function SettingsSeoIntro({ section = "header" }: SettingsSeoIntroProps) {
  if (section === "footer") {
    return (
      <Panel className="mt-10">
        <div className="space-y-8 text-sm leading-relaxed text-muted">
          <section>
            <h2 className="font-display text-lg font-bold text-ink">
              Billing, plans, and workspace limits
            </h2>
            <p className="mt-2">
              The billing panel on this page reflects your current plan — Free,
              Pilot, or Fleet — and how many workspaces you can run. Free includes
              one workspace and up to ten money prompts per audit; Pilot expands to
              three workspaces and twenty-five monitored prompts with weekly
              rescans; Fleet removes workspace caps for agencies managing client
              portfolios. Upgrade links route to{" "}
              <Link href="/pricing" className="font-semibold text-accent">
                pricing
              </Link>{" "}
              when you need monitoring, CMS publishing, or white-label proof
              reports at scale.
            </p>
            <p className="mt-2">
              Prompt limits and Monday re-scan cadence are enforced from these
              settings, so keep your monitored prompt list aligned with the buyer
              questions that actually drive pipeline. After changing plans, save
              settings and run a fresh audit from{" "}
              <Link href="/dashboard/geo-audit" className="font-semibold text-accent">
                GEO Audit
              </Link>{" "}
              to refresh citation scores against the new limits.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-ink">
              Related workspace tools
            </h2>
            <p className="mt-2">
              After updating settings, review prompt-level coverage in{" "}
              <Link href="/dashboard/analytics" className="font-semibold text-accent">
                Analytics
              </Link>
              , ship fixes from{" "}
              <Link href="/dashboard/content" className="font-semibold text-accent">
                Content
              </Link>
              , and export a stakeholder report from{" "}
              <Link href="/report/proof" className="font-semibold text-accent">
                Proof report
              </Link>
              . Need a walkthrough? Visit{" "}
              <Link href="/dashboard/help" className="font-semibold text-accent">
                Help
              </Link>{" "}
              for workflows on money prompts, CMS publishing, and Fleet bulk
              import.
            </p>
            <h3 className="mt-4 font-semibold text-ink">Settings checklist</h3>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>
                Confirm domain and primary buyer question match how prospects
                search AI.
              </li>
              <li>
                Add competitors you lose to on comparison and alternatives
                prompts.
              </li>
              <li>
                Set monitoring email before enabling weekly digest or proof report
                alerts.
              </li>
              <li>Re-run an audit after major prompt or domain changes.</li>
            </ul>
          </section>

          <section aria-labelledby="settings-faq">
            <h2
              id="settings-faq"
              className="font-display text-lg font-bold text-ink"
            >
              Workspace settings FAQ
            </h2>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="font-semibold text-ink">
                  What happens when I change money prompts?
                </dt>
                <dd className="mt-1">
                  Saved prompts feed the next audit and weekly rescan. Citation
                  scores, platform presence, and gap reports all update from the
                  new list — so remove outdated prompts and add new buyer questions
                  as your positioning shifts.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">
                  Which notification toggles matter most?
                </dt>
                <dd className="mt-1">
                  Start with weekly citation digest and audit-complete alerts.
                  Enable competitor-move and score-drop warnings on Pilot+ when
                  you need proactive signals before stakeholders ask why AI
                  visibility changed.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">
                  How does Autopilot use my settings?
                </dt>
                <dd className="mt-1">
                  Autopilot reads your domain, prompts, competitors, and
                  notification email to generate a prioritized seven-day plan
                  after each Monday rescan and optionally deliver a client-ready
                  proof summary.
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
        GEO citation workspace settings
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted md:text-base">
        CitePilot settings connect your domain, money prompts, and notification
        preferences to a single generative engine optimization workspace. Every
        field on this page feeds GEO audits, weekly rescans, proof reports, and
        Autopilot action plans — so accuracy here directly affects how well we
        track ChatGPT, Perplexity, Google AI Overviews, and other AI answer
        surfaces on high-intent buyer questions.
      </p>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted md:text-base">
        Use the form below to edit your workspace profile, monitored prompts,
        alert preferences, and Fleet white-label options. New users can run the{" "}
        <Link href="/audit" className="font-semibold text-accent">
          free citation audit
        </Link>{" "}
        first, then return here to tune tracking before enabling Pilot
        monitoring.
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            Workspace profile and citation tracking
          </h2>
          <p className="mt-2">
            Start with your primary domain and business category. Your description
            and buyer question teach CitePilot which high-intent prompts matter
            for pipeline — not vanity keywords. Add up to two audience segments
            and competitor domains so benchmark emails and gap alerts compare you
            against the brands buyers actually see in AI answers.
          </p>
          <p className="mt-2">
            Monitored prompts live on this page as well: one prompt per line, tied
            to your plan limits. Free workspaces can track a focused set; Pilot
            and Fleet unlock more prompts per audit and automatic Monday rescans
            that refresh citation scores, platform presence, and weekly lift chips
            on your{" "}
            <Link href="/dashboard" className="font-semibold text-accent">
              dashboard overview
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            Notifications, Autopilot, and client reporting
          </h2>
          <p className="mt-2">
            Set a monitoring email, then choose which events should reach your
            inbox: weekly citation digests, audit-complete alerts, score-drop
            warnings, competitor move signals, proof report emails with share
            links, and discussion opportunities from Hacker News or Stack
            Overflow. Pilot and Fleet add competitor move alerts and
            stakeholder-ready proof report delivery after each re-scan.
          </p>
          <p className="mt-2">
            Autopilot (Pilot+) runs after Monday rescans to summarize what
            changed, generate a prioritized seven-day plan, and optionally email a
            client-ready report. Fleet customers can also configure agency name,
            logo URL, and white-label share links that hide CitePilot branding on
            exported proof PDFs.
          </p>
        </section>
      </div>
    </Panel>
  );
}
