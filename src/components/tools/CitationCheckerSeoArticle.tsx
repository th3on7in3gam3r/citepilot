import Link from "next/link";

export function CitationCheckerSeoArticle() {
  return (
    <article className="prose prose-invert mx-auto mt-16 max-w-3xl prose-headings:font-display prose-headings:font-bold prose-a:text-glow">
      <h2>What is AI citation checking?</h2>
      <p>
        AI citation checking measures whether large language models and answer engines
        mention your brand when buyers ask high-intent questions — comparisons,
        alternatives, best-for, and pricing queries. Unlike traditional SEO rank
        tracking, citation checking focuses on{" "}
        <strong>inclusion inside synthesized AI answers</strong>, not blue-link
        positions on a search results page.
      </p>
      <p>
        Generative Engine Optimization (GEO) teams treat citations as the new
        conversion surface. When ChatGPT, Perplexity, or Google AI Overviews recommend
        a vendor by name, that recommendation carries implicit trust — similar to a
        peer referral. If your brand is absent, a competitor captures the narrative
        before the prospect ever visits your site.
      </p>
      <h3>How CitePilot&apos;s free checker works</h3>
      <p>
        Enter your domain and one money prompt — the question your best customers ask
        before they buy. CitePilot scans on-site GEO signals (schema, answer capsules,
        entity clarity) and, when API keys are configured, runs live probes against
        major AI surfaces. You get a per-platform verdict: cited, not cited, or
        inferred from technical signals.
      </p>
      <p>
        A single-prompt check is a diagnostic snapshot. Most B2B teams track ten to
        twenty-five prompts weekly because citation rates vary by intent, platform,
        and competitor activity. That is why Pilot includes ongoing monitoring,
        citation trend alerts, and proof reports that tie remediation to measurable
        lift.
      </p>
      <h3>What to do when you are not cited</h3>
      <p>
        Start with extractability: FAQ schema aligned to your prompt wording, a concise
        answer capsule above the fold, and comparison content that models can quote
        without distortion. Then strengthen off-site consensus — reviews, community
        answers, and analyst mentions that AI engines already trust for your category.
      </p>
      <p>
        Ready for the full picture?{" "}
        <Link href="/audit">Run a free 10-prompt audit</Link> or{" "}
        <Link href="/pricing">upgrade to Pilot</Link> to monitor twenty-five prompts
        every week with citation trend alerts.
      </p>
    </article>
  );
}
