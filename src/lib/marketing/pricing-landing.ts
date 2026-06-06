/** Copy and metadata for the public /pricing page. */

export const pricingLanding = {
  path: "/pricing",
  title: "GEO and AI Citation Monitoring Plans",
  shortTitle: "GEO Citation Monitoring Plans",
  description:
    "Compare CitePilot Free, Pilot, and Fleet plans. Start with a free 60-second citation audit, then scale GEO monitoring, CMS publishing, and agency reporting.",
} as const;

export const pricingFaqs = [
  {
    q: "Can I start without paying?",
    a: "Yes. The Free tier includes one workspace and a citation audit with up to 10 money prompts across eight AI platforms. Run the audit, share the report, and upgrade only when you need weekly monitoring or CMS publishing.",
  },
  {
    q: "What does Pilot add over the free audit?",
    a: "Pilot monitors up to 25 prompts on a weekly cadence, tracks citation deltas, sends competitor-move alerts, generates prioritized action plans, and publishes fixes to Webflow, WordPress, Ghost, Shopify, or Framer.",
  },
  {
    q: "When should an agency choose Fleet?",
    a: "Fleet is built for agencies managing multiple client brands. You get unlimited workspaces, white-label audit reports, JSON export, API keys, CSV bulk prompt import, and priority support.",
  },
  {
    q: "Which AI engines does CitePilot monitor?",
    a: "Every plan maps presence across ChatGPT, Perplexity, Google AI Overviews, Gemini, Copilot, Claude, Grok, and DeepSeek. Live API probes run where keys are configured; remaining engines use GEO-informed inference from your site signals.",
  },
] as const;
