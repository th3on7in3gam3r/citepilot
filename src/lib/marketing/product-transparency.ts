/** Honest product boundaries — use on marketing pages for B2B trust. */

export const productTransparency = {
  eyebrow: "Transparency",
  title: "What CitePilot does — and doesn't do",
  intro:
    "CitePilot is citation intelligence for GEO teams. We automate monitoring, measurement, and planning — not guaranteed placement inside AI answers.",
} as const;

export const productDoes = [
  {
    title: "Audit & monitor money prompts",
    body: "Crawl your site, score GEO readiness, and re-scan prompts on a weekly cadence (Pilot+). Track citation deltas over time.",
  },
  {
    title: "Live probes where configured",
    body: "ChatGPT, Perplexity, and Google AI Overviews use live API checks when server keys are set. Other engines use GEO-informed estimates until live keys are added.",
  },
  {
    title: "Prioritize fixes that matter",
    body: "Autopilot and Insights turn gaps into a ranked weekly plan — schema, answer capsules, content, and third-party mentions tied to buyer prompts.",
  },
  {
    title: "Generate content & publish when you approve",
    body: "Draft articles from audit gaps and publish to connected CMS providers from the article queue. You choose what goes live.",
  },
  {
    title: "Prove citation lift",
    body: "Re-scan after you ship fixes and show shareable proof reports — citation rate per prompt, platform map, competitor context.",
  },
] as const;

export const productDoesNot = [
  {
    title: "Guarantee AI citations",
    body: "We cannot control what ChatGPT, Perplexity, Google, or any LLM chooses to cite. Scores and audits are informational — not outcome guarantees.",
  },
  {
    title: "Edit your live website for you",
    body: "Quick-fix and in-app “auto-fix” update audit scoring and recommendations. They do not inject schema or change your production site unless you implement or publish.",
  },
  {
    title: "Auto-publish without you",
    body: "Autopilot never publishes to CMS. Weekly emails and plans are advisory. Publishing is manual from Content or your CMS workflow.",
  },
  {
    title: "Replace full technical SEO crawls",
    body: "GEO-focused audits complement traditional SEO suites — they are not a substitute for enterprise site crawls or backlink index depth.",
  },
] as const;

export const liveVsInferredNote =
  "Live today: ChatGPT (OpenAI), Perplexity, Google AI Overviews (Serper/SerpAPI). Estimated from site signals: Gemini, Copilot, Claude, Grok, DeepSeek — shown for coverage context, not live answer probes.";

export const transparencyFaqs = [
  {
    q: "Does CitePilot automatically get me cited?",
    a: "No. CitePilot monitors whether you appear to be cited, recommends fixes, and measures change after you ship them. Getting cited still depends on your site, content, authority, and what each AI engine retrieves.",
  },
  {
    q: "What does Autopilot actually automate?",
    a: "Weekly re-scans (Pilot+), optional Insights action plans, and optional email reports with citation deltas and proof links. It does not modify your website or publish to CMS.",
  },
  {
    q: "Are all eight platforms checked live?",
    a: "Not always. Three engines support live probes when API keys are configured. The rest use GEO-informed inference from your technical score and prompt alignment. Your audit report labels live vs estimated results.",
  },
] as const;
