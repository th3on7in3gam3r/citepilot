import Link from "next/link";

/** Server-rendered audit page copy — targets citation audit search intent. */
export function AuditSeoIntro() {
  return (
    <article className="mx-auto max-w-3xl space-y-8 border-t border-border pt-14 text-sm leading-relaxed text-muted">
      <section>
        <h2 className="font-display text-xl font-bold text-ink md:text-2xl">
          Free AI citation audit — what you get in 60 seconds
        </h2>
        <p className="mt-3">
          The CitePilot citation audit is a free engine diagnostic for brands
          that need to know whether ChatGPT, Perplexity, and Google AI Overviews
          cite them on real buyer questions — not vanity keywords. Enter your
          domain and up to ten money prompts; the tool fetches your live site,
          scores GEO technical readiness, probes AI surfaces, and returns a
          citation score with fix priorities.
        </p>
        <p className="mt-3">
          Unlike traditional SEO crawlers, this audit is prompt-native: each
          line you submit is evaluated for brand citation or on-site alignment,
          with plain-language reasons when you are missing. That makes it the
          fastest way to baseline Share of Model before investing in content or
          schema work.
        </p>
      </section>

      <section>
        <h2 className="font-display text-lg font-bold text-ink">
          GEO technical diagnostic included
        </h2>
        <p className="mt-2">
          Every run parses JSON-LD, FAQPage schema, Organization entity markup,
          Open Graph tags, robots.txt crawlability, and sitemap discovery. These
          signals feed a GEO score that explains retrieval blockers — the layer
          AI engines evaluate before citing your domain in synthesized answers.
        </p>
        <p className="mt-2">
          For a deeper technical workflow, open{" "}
          <Link href="/dashboard/geo-audit" className="font-semibold text-accent">
            GEO Audit
          </Link>{" "}
          in the workspace after signup, or follow the{" "}
          <Link href="/nurture#geo-perplexity" className="font-semibold text-accent">
            Perplexity citation playbook
          </Link>{" "}
          for structured data and entity optimization steps.
        </p>
      </section>

      <section>
        <h2 className="font-display text-lg font-bold text-ink">
          Live vs inferred engine checks
        </h2>
        <p className="mt-2">
          When server API keys are configured, ChatGPT answers are probed via
          OpenAI, Perplexity via its API, and Google AI Overviews via Serper —
          checking whether your brand or domain appears in responses to your
          exact prompts. Additional engines (Gemini, Copilot, Claude, Grok,
          DeepSeek) use GEO-informed inference from site signals until live keys
          are added, so you still get a full platform presence map in one pass.
        </p>
      </section>

      <section>
        <h3 className="font-display text-base font-bold text-ink">
          After your free audit
        </h3>
        <p className="mt-2">
          Create a workspace at{" "}
          <Link href="/start" className="font-semibold text-accent">
            Start analysis
          </Link>{" "}
          for weekly rescans, Autopilot action plans, and proof reports. Map
          prompts programmatically with the{" "}
          <Link href="/chatgpt-prompts" className="font-semibold text-accent">
            ChatGPT money prompts guide
          </Link>
          , or compare AEO vs GEO metrics on the{" "}
          <Link href="/ai-visibility" className="font-semibold text-accent">
            AI visibility service
          </Link>{" "}
          page.
        </p>
      </section>
    </article>
  );
}
