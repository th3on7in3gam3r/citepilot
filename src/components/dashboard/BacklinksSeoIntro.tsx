import { Panel } from "@/components/dashboard/DashboardUI";
import Link from "next/link";

/** Server-rendered backlinks hub overview for SEO and orientation. */
export function BacklinksSeoIntro() {
  return (
    <Panel className="mt-10">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
        Authority backlinks for GEO citation lift
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted md:text-base">
        CitePilot backlinks help you earn contextual mentions on trusted sites —
        the third-party proof that ChatGPT, Perplexity, and Google AI Overviews
        weigh when deciding which brands to cite. This dashboard tracks your
        referring profile, surfaces peer targets from competitors, and coordinates
        placements through the CitePilot link network without spammy link schemes.
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            Backlink profile & discovery scans
          </h2>
          <p className="mt-2">
            Refresh your backlink scan to update domain rating, referring source
            count, and recent referring pages discovered via configured search APIs.
            When Serper or Tavily keys are present, CitePilot finds pages that
            already mention competitors or category leaders — useful targets for
            outreach, guest content, or reciprocal network placements. Without
            search keys, competitor domains from Settings still seed peer
            recommendations.
          </p>
          <p className="mt-2">
            Treat backlinks as part of your GEO loop: audits show on-site gaps,
            content closes answer-intent pages, and authority links reinforce
            entity trust off-site. Re-scan citations after meaningful placements
            go live to see whether money-prompt share moves.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            CitePilot link network & placement requests
          </h2>
          <p className="mt-2">
            Opt into the link network to exchange vetted, contextual backlinks
            with other CitePilot workspaces in adjacent niches. Network credits
            limit how many outbound placements you can request per period so
            quality stays high. Submit a target URL, anchor text, and optional
            context note; we match a partner or queue the request until a fit is
            available. Track status from queued through live on the placements
            table.
          </p>
          <p className="mt-2">
            Accept incoming partner requests when they align with your editorial
            standards, or decline without penalty. Mark placements live once the
            link is published so both workspaces keep accurate records for
            reporting and future audits.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            How backlinks support AI visibility
          </h2>
          <p className="mt-2">
            Generative engines blend retrieval, entity confidence, and topical
            authority. A strong backlink graph signals that real publishers trust
            your brand — especially when anchors match buyer questions you track
            in{" "}
            <Link href="/dashboard/settings" className="font-semibold text-accent">
              Settings
            </Link>
            . Pair network placements with comparison articles from{" "}
            <Link href="/dashboard/content" className="font-semibold text-accent">
              Content
            </Link>{" "}
            and technical fixes from{" "}
            <Link href="/dashboard/geo-audit" className="font-semibold text-accent">
              GEO Audit
            </Link>{" "}
            for the fastest citation gains.
          </p>
          <h3 className="mt-4 font-semibold text-ink">Best practices</h3>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Request anchors that match money prompts, not generic brand keywords.</li>
            <li>Point links to pages that directly answer buyer questions.</li>
            <li>Refresh scans monthly and after major campaigns or launches.</li>
            <li>Re-run citation audits within seven days of a live placement.</li>
          </ul>
        </section>
      </div>
    </Panel>
  );
}
