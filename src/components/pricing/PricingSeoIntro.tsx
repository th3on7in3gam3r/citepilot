import Link from "next/link";

/** Server-rendered pricing page copy — H2/H3 structure for SEO depth. */
export function PricingSeoIntro() {
  return (
    <article className="mx-auto max-w-3xl space-y-10 border-t border-border pt-14 text-sm leading-relaxed text-muted">
      <section>
        <h2 className="font-display text-xl font-bold text-ink md:text-2xl">
          Why GEO citation monitoring needs a dedicated plan
        </h2>
        <p className="mt-3">
          Generative Engine Optimization (GEO) is not a one-time SEO audit. Buyer
          questions evolve, competitors publish new proof pages, and AI answer
          engines refresh retrieval indexes on their own cadence. A single
          snapshot tells you where you stand today — ongoing monitoring tells you
          whether your fixes actually moved citations on ChatGPT, Perplexity,
          and Google AI Overviews.
        </p>
        <p className="mt-3">
          CitePilot pricing is structured around that loop: baseline with a free
          citation audit, operationalize with Pilot for weekly rescans and
          publishing, and scale with Fleet when you manage multiple client
          brands. Every tier is prompt-native — you track the money questions
          buyers ask AI, not vanity keywords that never appear in synthesized
          answers.
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold text-ink md:text-2xl">
          Free audit vs Pilot vs Fleet
        </h2>
        <p className="mt-3">
          The Free tier is a full engine diagnostic, not a crippled trial. You
          get one workspace, up to ten buyer prompts, an eight-platform citation
          map, competitor mentions, GEO readiness scoring, and a shareable report
          link — enough to baseline Share of Model before you commit budget.
        </p>

        <h3 className="font-display mt-6 text-base font-bold text-ink">
          Pilot — for founders shipping weekly fixes
        </h3>
        <p className="mt-2">
          Pilot ($79/mo) adds three workspaces, 25 monitored prompts, weekly
          prioritized action plans, citation delta tracking, email alerts when
          competitors gain ground, CitePilot Insights for gap explanations, and
          direct CMS publish to Webflow, WordPress, Ghost, Shopify, and Framer.
          It is the default upgrade when a free audit surfaces recurring gaps you
          need to close on a schedule.
        </p>

        <h3 className="font-display mt-6 text-base font-bold text-ink">
          Fleet — for agencies and multi-brand teams
        </h3>
        <p className="mt-2">
          Fleet ($249/mo) removes workspace caps so agencies can run unlimited
          client sites from one account. You also get white-label audit reports,
          JSON export, API keys for custom integrations, CSV bulk prompt import,
          and priority support — the operational layer consultancies need when
          citation proof becomes part of every client deliverable.
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold text-ink md:text-2xl">
          What every plan includes
        </h2>
        <p className="mt-3">
          Regardless of tier, CitePilot measures citation presence across eight
          AI answer surfaces, scores GEO technical signals (JSON-LD, FAQPage
          schema, Organization entity markup, robots and sitemap health), and
          translates gaps into plain-language fix priorities. Paid plans add
          monitoring cadence, Autopilot workflows, and publishing — the
          execution layer that turns diagnostics into measurable citation lift.
        </p>
        <p className="mt-3">
          New to GEO? Start with the{" "}
          <Link href="/nurture" className="font-semibold text-accent">
            GEO Playbook
          </Link>
          , map buyer intent with the{" "}
          <Link href="/chatgpt-prompts" className="font-semibold text-accent">
            ChatGPT money prompts guide
          </Link>
          , or run the{" "}
          <Link href="/audit" className="font-semibold text-accent">
            free 60-second citation audit
          </Link>{" "}
          before choosing a plan. For metric definitions and schema automation,
          see the{" "}
          <Link href="/ai-visibility" className="font-semibold text-accent">
            AI visibility service
          </Link>{" "}
          overview.
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold text-ink md:text-2xl">
          When to upgrade from free to Pilot
        </h2>
        <p className="mt-3">
          Upgrade when citation movement matters week over week — not as a
          one-off check. Common triggers: a competitor started appearing on your
          core money prompts, your content team needs a prioritized fix queue
          instead of ad-hoc rewrites, or you want CMS publish without copying
          drafts between tools. Pilot keeps the same prompt set under continuous
          watch so you can prove lift in client reports and internal reviews.
        </p>
        <h3 className="font-display mt-6 text-base font-bold text-ink">
          Agency and multi-brand workflows
        </h3>
        <p className="mt-2">
          If you are onboarding more than three brands, Fleet pays for itself in
          workspace overhead alone. White-label reports let you deliver citation
          proof under your agency brand, while API access and bulk import reduce
          manual setup when client rosters change every quarter.
        </p>
      </section>
    </article>
  );
}
