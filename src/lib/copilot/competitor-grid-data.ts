import type { WorkspaceSnapshot } from "@/lib/dashboard";
import { domainSeed } from "@/lib/dashboard";
import { promptRowsForWorkspace } from "@/lib/dashboard-data";

export type CompetitorGridRow = {
  id: string;
  domain: string;
  ndScore: number;
  cpc: number;
  pageViews: number;
  h1: string;
  keywordTargeted: string;
  trend: number;
  lastUpdated: string;
  isYou?: boolean;
};

const KEYWORDS = [
  "DataOps tools",
  "Pipeline automation",
  "CI/CD for data",
  "Marketing automation",
  "SEO platform",
  "Affiliate marketing",
  "Healthcare SaaS",
  "Local SEO tools",
];

const H1_TEMPLATES = [
  "Best {kw} for enterprise teams",
  "{kw} software comparison",
  "How to choose a {kw} platform",
  "Top {kw} solutions in 2025",
  "{kw} for marketing teams",
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function formatViews(n: number): string {
  return n.toLocaleString();
}

export function buildCompetitorGridRows(workspace: WorkspaceSnapshot): CompetitorGridRow[] {
  const seed = domainSeed(workspace.domain);
  const prompts = promptRowsForWorkspace(workspace);
  const yourDomain = workspace.domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const yourKw =
    prompts[0]?.prompt?.slice(0, 40) ??
    workspace.buyerQuestion?.slice(0, 40) ??
    KEYWORDS[seed % KEYWORDS.length];

  const yourRow: CompetitorGridRow = {
    id: "you",
    domain: yourDomain,
    ndScore: workspace.domainRating || workspace.citationScore,
    cpc: 1.2 + (seed % 5) * 0.1,
    pageViews: 3200 + (seed % 20) * 400,
    h1: H1_TEMPLATES[0].replace("{kw}", yourKw.split(" ")[0] ?? "SEO"),
    keywordTargeted: yourKw,
    trend: workspace.citationScore > 50 ? 8 : -4,
    lastUpdated: "Today",
    isYou: true,
  };

  const competitors = workspace.competitors.length
    ? workspace.competitors
    : [
        "www.atlassian.com",
        "about.gitlab.com",
        "circleci.com",
        "www.hubspot.com",
        "moz.com",
      ];

  const rows = competitors.slice(0, 12).map((domain, i) => {
    const h = hash(domain + String(seed));
    const kw = KEYWORDS[(seed + i) % KEYWORDS.length];
    const nd = 45 + (h % 55);
    const views = 800 + (h % 9000);
    return {
      id: `comp-${i}`,
      domain: domain.replace(/^https?:\/\//, ""),
      ndScore: nd,
      cpc: 0.4 + (h % 80) / 20,
      pageViews: views,
      h1: H1_TEMPLATES[(h + i) % H1_TEMPLATES.length].replace("{kw}", kw),
      keywordTargeted: kw,
      trend: (h % 40) - 18,
      lastUpdated: `${1 + (h % 14)}d ago`,
    };
  });

  return [yourRow, ...rows];
}

export function formatPageViews(n: number): string {
  return formatViews(n);
}

export function yourSiteContext(workspace: WorkspaceSnapshot): {
  yourNdScore: number;
  yourPageViews: number;
} {
  const rows = buildCompetitorGridRows(workspace);
  const you = rows.find((r) => r.isYou) ?? rows[0];
  return {
    yourNdScore: you?.ndScore ?? workspace.citationScore,
    yourPageViews: you?.pageViews ?? 3000,
  };
}
