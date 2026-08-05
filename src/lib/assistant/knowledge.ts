import {
  homepageFaqItems,
  pricingSpecificFaqs,
  type FaqItem,
} from "@/lib/marketing/site-faq";
import { site } from "@/lib/site";

const PRODUCT_FACTS: FaqItem[] = [
  {
    id: "tiers",
    q: "What are CitePilot plans and prices?",
    a: "Free: 1 workspace, 1 audit snapshot, 10 prompts. Pilot: $79/mo with weekly rescans and more monitored prompts. Fleet: $249/mo with unlimited workspaces, white-label, and API access. See /pricing for current details.",
  },
  {
    id: "start",
    q: "How do I start?",
    a: `Run a free citation audit at /start or on ${site.url} — no credit card required. Paid plans add ongoing monitoring and digests.`,
  },
  {
    id: "consulting",
    q: "Do you offer consulting?",
    a: "Yes. High-touch GEO consulting (strategy sessions, citation rescue, agency desk review) is available at /consulting. Inquiries are human-reviewed — nothing auto-publishes to a CRM.",
  },
  {
    id: "engines",
    q: "Which AI engines does CitePilot track?",
    a: "CitePilot tracks brand citations across ChatGPT, Perplexity, Gemini, Google AI Overviews, Grok, and DeepSeek (coverage can vary by plan and probe availability).",
  },
  {
    id: "guarantee",
    q: "Does CitePilot guarantee citations?",
    a: "No. CitePilot monitors citation presence, recommends fixes, and measures change. We do not control what any AI engine cites.",
  },
];

const MAX_PACK_CHARS = 12_000;

/** Compact FAQ + product facts for the marketing site assistant. */
export function buildAssistantKnowledgePack(): FaqItem[] {
  const seen = new Set<string>();
  const out: FaqItem[] = [];
  let chars = 0;

  for (const item of [
    ...PRODUCT_FACTS,
    ...pricingSpecificFaqs,
    ...homepageFaqItems(),
  ]) {
    const key = item.q.trim().toLowerCase();
    if (seen.has(key)) continue;
    const block = `Q: ${item.q}\nA: ${item.a}`;
    if (chars + block.length > MAX_PACK_CHARS) break;
    seen.add(key);
    out.push(item);
    chars += block.length;
  }

  return out;
}

export function formatKnowledgeForPrompt(items: FaqItem[]): string {
  return items.map((item, i) => `${i + 1}. Q: ${item.q}\n   A: ${item.a}`).join("\n\n");
}
