import { Panel } from "@/components/dashboard/DashboardUI";
import Link from "next/link";

/** Server-rendered settings overview for SEO and first-time orientation. */
export function SettingsSeoIntro() {
  return (
    <Panel className="mb-8">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
        GEO citation workspace settings
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted md:text-base">
        CitePilot settings are where you connect your domain, money prompts, and
        notification preferences to a single GEO citation workspace. Every field
        below feeds your audits, weekly rescans, proof reports, and Autopilot
        plans — so accuracy here directly affects how well we track ChatGPT,
        Perplexity, Google AI Overviews, and other AI answer surfaces.
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            Workspace profile and citation tracking
          </h2>
          <p className="mt-2">
            Start with your primary domain and business category. Your description
            and buyer question teach CitePilot which high-intent prompts matter for
            pipeline — not vanity keywords. Add up to two audience segments and
            competitor domains so benchmark emails and gap alerts compare you
            against the brands buyers actually see in AI answers.
          </p>
          <p className="mt-2">
            Monitored prompts live on this page as well: one prompt per line, tied
            to your plan limits. Free workspaces can track a focused set; Pilot and
            Fleet unlock more prompts per audit and automatic Monday rescans that
            refresh citation scores, platform presence, and weekly lift chips on
            your dashboard.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            Notifications, Autopilot, and client reporting
          </h2>
          <p className="mt-2">
            Set a monitoring email, then choose which events should reach your
            inbox: weekly citation digests, audit-complete alerts, score-drop
            warnings, competitor move signals, proof report emails with share links,
            and discussion opportunities from Hacker News or Stack Overflow.
            Pilot and Fleet add competitor move alerts and stakeholder-ready proof
            report delivery after each re-scan.
          </p>
          <p className="mt-2">
            Autopilot (Pilot+) runs after Monday rescans to summarize what changed,
            generate a prioritized seven-day plan, and optionally email a
            client-ready report. Fleet customers can also configure agency name,
            logo URL, and white-label share links that hide CitePilot branding on
            exported proof PDFs.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            Related workspace tools
          </h2>
          <p className="mt-2">
            After updating settings, run a fresh audit from{" "}
            <Link href="/dashboard/geo-audit" className="font-semibold text-accent">
              GEO Audit
            </Link>{" "}
            or Overview, review prompt-level coverage in{" "}
            <Link href="/dashboard/analytics" className="font-semibold text-accent">
              Analytics
            </Link>
            , and export a stakeholder report from{" "}
            <Link href="/report/proof" className="font-semibold text-accent">
              Proof report
            </Link>
            . Need a walkthrough? Visit{" "}
            <Link href="/dashboard/help" className="font-semibold text-accent">
              Help
            </Link>{" "}
            for workflows on money prompts, CMS publishing, and Fleet bulk import.
          </p>
          <h3 className="mt-4 font-semibold text-ink">Quick checklist</h3>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Confirm domain and primary buyer question match how prospects search AI.</li>
            <li>Add competitors you lose to on comparison and alternatives prompts.</li>
            <li>Set monitoring email before enabling weekly digest or proof report alerts.</li>
            <li>Re-run an audit after major prompt or domain changes.</li>
          </ul>
        </section>
      </div>
    </Panel>
  );
}
