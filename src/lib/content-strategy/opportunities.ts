import type { WorkspaceSnapshot } from "@/lib/dashboard";
import {
  buildContentCalendar,
  buildMoneyPromptIdeas,
} from "@/lib/dashboard-data";
import { AUDIENCE_LABELS, CONTENT_TYPE_LABELS } from "./constants";
import type {
  AudienceSegment,
  ContentType,
  EditorialPillarId,
} from "./types";
import {
  editorialPillarTitle,
  pillarForCalendarFormat,
  pillarForMoneyPromptIntent,
} from "./suggestions";

export type ContentOpportunity = {
  topic: string;
  angle: string;
  format: ContentType;
  pillar: EditorialPillarId;
  audience: AudienceSegment;
  badge: string;
  source: "workspace" | "weekly" | "editorial";
};

type WorkspaceContext = {
  domain: string;
  competitor: string;
  buyerQuestion: string;
  businessType: string;
};

type OpportunityTemplate = {
  topic: string;
  angle: string;
  pillar: EditorialPillarId;
  audience: AudienceSegment;
  format: ContentType;
};

/** Curated templates — personalized with workspace context, rotated weekly. */
const EDITORIAL_OPPORTUNITY_BANK: OpportunityTemplate[] = [
  // GEO
  {
    topic: "How {domain} can earn ChatGPT citations for {buyerQuestion}",
    angle: "Buyer-intent GEO playbook with FAQ schema and answer capsules.",
    pillar: "geo",
    audience: "saas",
    format: "pillar",
  },
  {
    topic: "Perplexity vs Google AI: where {domain} should show up first",
    angle: "Platform-by-platform citation strategy for commercial prompts.",
    pillar: "geo",
    audience: "growth-marketing",
    format: "comparison",
  },
  {
    topic: "Weekly GEO scorecard template for {businessType} teams",
    angle: "Repeatable reporting format for share-of-model and prompt wins.",
    pillar: "geo",
    audience: "agency",
    format: "tutorial",
  },
  {
    topic: "AI search update: what changed for {businessType} brands this week",
    angle: "News-style trend brief with actionable follow-ups.",
    pillar: "geo",
    audience: "solo-founder",
    format: "news",
  },
  // SEO automation
  {
    topic: "Content automation workflow for {domain} without generic AI slop",
    angle: "Human-in-the-loop prompts, outlines, and QA checklist.",
    pillar: "seo-automation",
    audience: "solo-founder",
    format: "tutorial",
  },
  {
    topic: "Batch blog production for agencies managing {competitor}-style clients",
    angle: "Editorial ops: briefs, templates, and publish cadence.",
    pillar: "seo-automation",
    audience: "agency",
    format: "pillar",
  },
  {
    topic: "SEO automation stack for lean {businessType} marketing teams",
    angle: "Compare workflows for research, drafting, and internal linking.",
    pillar: "seo-automation",
    audience: "growth-marketing",
    format: "comparison",
  },
  {
    topic: "This week in SEO automation: tools worth testing for SaaS blogs",
    angle: "Short trend roundup with pros/cons for busy founders.",
    pillar: "seo-automation",
    audience: "saas",
    format: "news",
  },
  // Technical SEO
  {
    topic: "Technical SEO checklist before {domain} chases AI citations",
    angle: "Crawlability, schema, CWV, and indexation fixes in priority order.",
    pillar: "technical-seo",
    audience: "growth-marketing",
    format: "tutorial",
  },
  {
    topic: "Schema playbook for {domain}: Organization, FAQ, and Product",
    angle: "Copy-paste JSON-LD patterns tied to money prompts.",
    pillar: "technical-seo",
    audience: "saas",
    format: "pillar",
  },
  {
    topic: "Core Web Vitals vs {competitor}: technical gap analysis",
    angle: "Side-by-side performance and crawl budget comparison.",
    pillar: "technical-seo",
    audience: "ecommerce",
    format: "comparison",
  },
  {
    topic: "Google crawl updates affecting {businessType} sites this month",
    angle: "News brief on indexing and rendering changes.",
    pillar: "technical-seo",
    audience: "agency",
    format: "news",
  },
  // Local SEO
  {
    topic: "Local SEO + AI visibility for {domain} service pages",
    angle: "GBP, local schema, and geo-modified money prompts.",
    pillar: "local-seo",
    audience: "ecommerce",
    format: "tutorial",
  },
  {
    topic: "Multi-location citation strategy when buyers ask “near me”",
    angle: "Pillar guide for local pack + AI assistant overlap.",
    pillar: "local-seo",
    audience: "agency",
    format: "pillar",
  },
  {
    topic: "{domain} vs {competitor} for local search intent",
    angle: "Comparison page structure for city and neighborhood queries.",
    pillar: "local-seo",
    audience: "growth-marketing",
    format: "comparison",
  },
  {
    topic: "Local SEO news: GBP features worth enabling this week",
    angle: "Quick hits for operators running local campaigns.",
    pillar: "local-seo",
    audience: "solo-founder",
    format: "news",
  },
  // Paid + organic
  {
    topic: "Paid + organic playbook when {competitor} owns the AI shortlist",
    angle: "Align PPC queries with SEO/GEO landing pages and proof assets.",
    pillar: "paid-organic",
    audience: "growth-marketing",
    format: "pillar",
  },
  {
    topic: "How to split budget between Google Ads and content for {domain}",
    angle: "Tutorial for teams balancing capture and demand creation.",
    pillar: "paid-organic",
    audience: "saas",
    format: "tutorial",
  },
  {
    topic: "{domain} pricing page vs {competitor}: conversion + citation angles",
    angle: "Comparison framework for bottom-funnel pages.",
    pillar: "paid-organic",
    audience: "ecommerce",
    format: "comparison",
  },
  {
    topic: "Weekly paid media + SEO sync for {businessType} marketers",
    angle: "News-style standup agenda for channel alignment.",
    pillar: "paid-organic",
    audience: "agency",
    format: "news",
  },
  // Agency growth
  {
    topic: "White-label GEO reporting template for clients like {domain}",
    angle: "Agency pillar: proof reports, SoM, and renewal narrative.",
    pillar: "agency-growth",
    audience: "agency",
    format: "pillar",
  },
  {
    topic: "How agencies productize AI citation audits for {businessType} niches",
    angle: "Packaging, pricing, and delivery SOP.",
    pillar: "agency-growth",
    audience: "agency",
    format: "tutorial",
  },
  {
    topic: "In-house team vs agency for {domain} SEO + GEO",
    angle: "Comparison for buyers evaluating build vs buy.",
    pillar: "agency-growth",
    audience: "saas",
    format: "comparison",
  },
  {
    topic: "Agency pipeline news: GEO services buyers are asking for",
    angle: "Trend brief to steer outbound and positioning.",
    pillar: "agency-growth",
    audience: "growth-marketing",
    format: "news",
  },
  // Cross-audience extras (fill gaps)
  {
    topic: "E-commerce AI visibility: product pages that get cited for {buyerQuestion}",
    angle: "Merchant-focused GEO for shopping and comparison prompts.",
    pillar: "geo",
    audience: "ecommerce",
    format: "tutorial",
  },
  {
    topic: "Founder’s guide: first 30 days of citation monitoring for {domain}",
    angle: "Solo-operator checklist from audit to weekly fixes.",
    pillar: "geo",
    audience: "solo-founder",
    format: "tutorial",
  },
  {
    topic: "SaaS comparison hub: {domain} vs {competitor} for {buyerQuestion}",
    angle: "Long-form comparison pillar for product-led growth teams.",
    pillar: "paid-organic",
    audience: "saas",
    format: "pillar",
  },
  {
    topic: "Shopify technical SEO sprint for {domain}",
    angle: "Theme, structured data, and faceted navigation fixes.",
    pillar: "technical-seo",
    audience: "ecommerce",
    format: "tutorial",
  },
  // Extra audience × format coverage (rotates weekly)
  {
    topic: "Growth team playbook: 90-day GEO roadmap for {domain}",
    angle: "Quarterly planning template with KPIs and prompt clusters.",
    pillar: "geo",
    audience: "growth-marketing",
    format: "pillar",
  },
  {
    topic: "Agency client onboarding: GEO baseline audit for {domain}",
    angle: "First-week deliverables agencies can white-label.",
    pillar: "geo",
    audience: "agency",
    format: "tutorial",
  },
  {
    topic: "E-commerce product schema vs {competitor} for AI shopping answers",
    angle: "Comparison of structured data patterns that earn citations.",
    pillar: "technical-seo",
    audience: "ecommerce",
    format: "comparison",
  },
  {
    topic: "SaaS founder news: AI search policy changes affecting {businessType}",
    angle: "Weekly scan of platform updates with one action item.",
    pillar: "geo",
    audience: "saas",
    format: "news",
  },
  {
    topic: "Solo founder tutorial: automate internal links on {domain}",
    angle: "Low-code workflow for 10 posts without an agency.",
    pillar: "seo-automation",
    audience: "solo-founder",
    format: "tutorial",
  },
  {
    topic: "Growth marketing pillar: full-funnel content map for {buyerQuestion}",
    angle: "Pillar architecture from awareness to comparison pages.",
    pillar: "paid-organic",
    audience: "growth-marketing",
    format: "pillar",
  },
  {
    topic: "Agency comparison: GEO tools vs building in-house for {domain}",
    angle: "Buy vs build matrix for multi-client shops.",
    pillar: "agency-growth",
    audience: "agency",
    format: "comparison",
  },
  {
    topic: "E-commerce news: retail AI assistants citing competitor brands",
    angle: "Trend brief with defensive content moves.",
    pillar: "local-seo",
    audience: "ecommerce",
    format: "news",
  },
  {
    topic: "SaaS tutorial: programmatic FAQ pages for {buyerQuestion}",
    angle: "Template-driven pages that satisfy buyers and crawlers.",
    pillar: "seo-automation",
    audience: "saas",
    format: "tutorial",
  },
  {
    topic: "Founder pillar: positioning {domain} for AI shortlists",
    angle: "Messaging, proof assets, and citation-ready claims.",
    pillar: "agency-growth",
    audience: "solo-founder",
    format: "pillar",
  },
  {
    topic: "Growth team comparison: {domain} vs {competitor} on technical SEO",
    angle: "Audit scorecard format for stakeholder buy-in.",
    pillar: "technical-seo",
    audience: "growth-marketing",
    format: "comparison",
  },
  {
    topic: "Agency news: RFP trends for GEO + SEO bundles in {businessType}",
    angle: "Pipeline intelligence for agency leadership.",
    pillar: "agency-growth",
    audience: "agency",
    format: "news",
  },
  {
    topic: "E-commerce pillar: category pages that win {buyerQuestion}",
    angle: "Merchant playbook for collection and PDP depth.",
    pillar: "paid-organic",
    audience: "ecommerce",
    format: "pillar",
  },
  {
    topic: "SaaS comparison: in-house content ops vs agency for {domain}",
    angle: "Cost, speed, and citation outcomes side by side.",
    pillar: "seo-automation",
    audience: "saas",
    format: "comparison",
  },
  {
    topic: "Founder news: free GEO tools worth trying this week",
    angle: "Curated stack for bootstrapped teams.",
    pillar: "seo-automation",
    audience: "solo-founder",
    format: "news",
  },
  {
    topic: "Local SEO tutorial: service-area pages for {domain}",
    angle: "City templates that pair with GBP and schema.",
    pillar: "local-seo",
    audience: "solo-founder",
    format: "tutorial",
  },
  {
    topic: "Growth marketing news: paid search + AI overview overlap",
    angle: "Channel sync brief for weekly marketing standups.",
    pillar: "paid-organic",
    audience: "growth-marketing",
    format: "news",
  },
];

const WEEKLY_ROTATION: {
  day: string;
  pillar: EditorialPillarId;
  format: ContentType;
  audience: AudienceSegment;
  topic: string;
  angle: string;
}[] = [
  {
    day: "Mon",
    pillar: "geo",
    format: "pillar",
    audience: "saas",
    topic: "Ultimate GEO guide: {buyerQuestion}",
    angle: "Monday pillar — citation gaps and money prompts.",
  },
  {
    day: "Tue",
    pillar: "seo-automation",
    format: "tutorial",
    audience: "solo-founder",
    topic: "Automate content ops for {domain} without losing voice",
    angle: "Tuesday tutorial — workflows and QA.",
  },
  {
    day: "Wed",
    pillar: "technical-seo",
    format: "tutorial",
    audience: "growth-marketing",
    topic: "Technical SEO fixes blocking {domain} from AI crawlers",
    angle: "Wednesday checklist — schema, speed, indexation.",
  },
  {
    day: "Thu",
    pillar: "paid-organic",
    format: "comparison",
    audience: "growth-marketing",
    topic: "{domain} vs {competitor} for paid + organic teams",
    angle: "Thursday comparison — align ads and SEO landing pages.",
  },
  {
    day: "Fri",
    pillar: "agency-growth",
    format: "news",
    audience: "agency",
    topic: "This week in AI search for agencies serving {businessType}",
    angle: "Friday trend brief — client-ready talking points.",
  },
  {
    day: "Sat",
    pillar: "local-seo",
    format: "tutorial",
    audience: "ecommerce",
    topic: "Local + AI visibility checklist for {domain}",
    angle: "Saturday local focus — GBP and service-area pages.",
  },
  {
    day: "Sun",
    pillar: "geo",
    format: "news",
    audience: "solo-founder",
    topic: "Sunday GEO digest: prompts to track for {domain}",
    angle: "Light weekly roundup for founders.",
  },
];

const AUDIENCES: AudienceSegment[] = [
  "growth-marketing",
  "solo-founder",
  "agency",
  "ecommerce",
  "saas",
];

const FORMATS: ContentType[] = ["pillar", "tutorial", "comparison", "news"];

function personalize(text: string, ctx: WorkspaceContext): string {
  return text
    .replace(/\{domain\}/g, ctx.domain)
    .replace(/\{competitor\}/g, ctx.competitor)
    .replace(/\{buyerQuestion\}/g, ctx.buyerQuestion)
    .replace(/\{businessType\}/g, ctx.businessType);
}

function workspaceContext(workspace: WorkspaceSnapshot): WorkspaceContext {
  return {
    domain: workspace.domain.replace(/^www\./, ""),
    competitor: workspace.competitors[0]?.replace(/^www\./, "") ?? "top competitor",
    buyerQuestion:
      workspace.buyerQuestion?.trim() ||
      `best ${workspace.businessType || "software"} for your audience`,
    businessType: workspace.businessType || "business",
  };
}

function audienceForMoneyIntent(
  intent: string,
  fallback: AudienceSegment,
): AudienceSegment {
  switch (intent) {
    case "buyer-fit":
      return "saas";
    case "alternatives":
      return "growth-marketing";
    case "comparison":
      return "saas";
    case "pricing":
      return "ecommerce";
    case "roi":
      return "solo-founder";
    case "implementation":
      return "agency";
    default:
      return fallback;
  }
}

function audienceForCalendar(
  format: string,
  week: string,
): AudienceSegment {
  const f = format.toLowerCase();
  if (f.includes("comparison")) return "saas";
  if (f.includes("faq")) return "solo-founder";
  if (f.includes("proof")) return "agency";
  if (week.toLowerCase().includes("week 1")) return "growth-marketing";
  return "growth-marketing";
}

function formatFromCalendarLabel(format: string): ContentType {
  const f = format.toLowerCase();
  if (f.includes("pillar")) return "pillar";
  if (f.includes("comparison")) return "comparison";
  if (f.includes("proof")) return "news";
  if (f.includes("faq")) return "tutorial";
  return "tutorial";
}

function formatFromMoneyIntent(intent: string): ContentType {
  if (intent === "comparison" || intent === "alternatives") return "comparison";
  if (intent === "pricing" || intent === "roi") return "comparison";
  return "tutorial";
}

export function formatShortLabel(format: ContentType): string {
  const full = CONTENT_TYPE_LABELS[format];
  if (format === "pillar") return "Pillar";
  if (format === "tutorial") return "Tutorial";
  if (format === "comparison") return "Comparison";
  return "News";
}

export function audienceShortLabel(audience: AudienceSegment): string {
  const label = AUDIENCE_LABELS[audience];
  if (audience === "growth-marketing") return "Growth team";
  if (audience === "solo-founder") return "Founder";
  return label.split("/")[0].trim().split(" ")[0];
}

export function opportunityBadge(op: Pick<
  ContentOpportunity,
  "audience" | "format" | "pillar"
>): string {
  return `${audienceShortLabel(op.audience)} · ${formatShortLabel(op.format)} · ${editorialPillarTitle(op.pillar).split(" ")[0]}`;
}

export function editorialWeekLabel(date = new Date()): string {
  const start = new Date(date);
  const day = start.getUTCDay() || 7;
  start.setUTCDate(start.getUTCDate() - day + 1);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return `Week of ${fmt(start)} – ${fmt(end)}`;
}

function rotationSeed(date = new Date()): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const today = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const dayOfYear = Math.floor((today - start) / 86_400_000);
  const week = Math.floor(dayOfYear / 7);
  return week * 7 + (date.getUTCDay() || 7);
}

function rotateTemplates<T>(items: T[], seed: number): T[] {
  if (items.length === 0) return [];
  const offset = seed % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

export function pickDiverseOpportunities(
  items: ContentOpportunity[],
  limit: number,
): ContentOpportunity[] {
  const seen = new Set<string>();
  const deduped = items.filter((item) => {
    const key = item.topic.toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const picked: ContentOpportunity[] = [];
  const used = {
    pillars: new Set<EditorialPillarId>(),
    audiences: new Set<AudienceSegment>(),
    formats: new Set<ContentType>(),
  };

  const score = (item: ContentOpportunity) => {
    let s = 0;
    if (!used.pillars.has(item.pillar)) s += 3;
    if (!used.audiences.has(item.audience)) s += 5;
    if (!used.formats.has(item.format)) s += 5;
    if (item.source === "weekly") s += 2;
    if (item.source === "workspace") s += 1;
    return s;
  };

  const pool = [...deduped];
  while (picked.length < limit && pool.length > 0) {
    pool.sort((a, b) => score(b) - score(a));
    const next = pool.shift()!;
    picked.push(next);
    used.pillars.add(next.pillar);
    used.audiences.add(next.audience);
    used.formats.add(next.format);
  }

  return picked;
}

/** Workspace + rotating editorial bank — refreshes daily/weekly. */
export function buildGenerateContentOpportunities(
  workspace: WorkspaceSnapshot,
  date = new Date(),
): ContentOpportunity[] {
  const ctx = workspaceContext(workspace);
  const seed = rotationSeed(date);
  const defaultAudience = audienceForBusinessType(workspace.businessType);

  const list: ContentOpportunity[] = [];

  for (const item of buildContentCalendar(workspace)) {
    const format = formatFromCalendarLabel(item.format);
    const audience = audienceForCalendar(item.format, item.week);
    list.push({
      topic: personalize(item.topic, ctx),
      angle: `Target focus: ${item.rationale}`,
      format,
      pillar: item.pillar ?? pillarForCalendarFormat(item.format, item.rationale),
      audience,
      badge: "",
      source: "workspace",
    });
  }

  for (const item of buildMoneyPromptIdeas(workspace)) {
    const format = formatFromMoneyIntent(item.intent);
    list.push({
      topic: personalize(item.prompt, ctx),
      angle: `Target intent: ${item.intent}. ${item.reason}`,
      format,
      pillar: item.pillar ?? pillarForMoneyPromptIntent(item.intent),
      audience: audienceForMoneyIntent(item.intent, defaultAudience),
      badge: "",
      source: "workspace",
    });
  }

  const dayIndex = (date.getUTCDay() || 7) - 1;
  const todaySlot = WEEKLY_ROTATION[dayIndex];
  if (todaySlot) {
    list.push({
      topic: personalize(todaySlot.topic, ctx),
      angle: todaySlot.angle,
      format: todaySlot.format,
      pillar: todaySlot.pillar,
      audience: todaySlot.audience,
      badge: "",
      source: "weekly",
    });
  }

  for (const slot of WEEKLY_ROTATION) {
    list.push({
      topic: personalize(slot.topic, ctx),
      angle: `${slot.day} — ${slot.angle}`,
      format: slot.format,
      pillar: slot.pillar,
      audience: slot.audience,
      badge: "",
      source: "weekly",
    });
  }

  const rotatedBank = rotateTemplates(EDITORIAL_OPPORTUNITY_BANK, seed);
  for (const template of rotatedBank) {
    list.push({
      topic: personalize(template.topic, ctx),
      angle: personalize(template.angle, ctx),
      format: template.format,
      pillar: template.pillar,
      audience: template.audience,
      badge: "",
      source: "editorial",
    });
  }

  return pickDiverseOpportunities(
    list.map((item) => ({ ...item, badge: opportunityBadge(item) })),
    12,
  );
}

function audienceForBusinessType(businessType: string): AudienceSegment {
  const n = businessType.toLowerCase();
  if (n.includes("saas")) return "saas";
  if (n.includes("ecommerce") || n.includes("shop")) return "ecommerce";
  if (n.includes("agency")) return "agency";
  if (n.includes("founder") || n.includes("solo")) return "solo-founder";
  return "growth-marketing";
}

export { AUDIENCES, FORMATS };
