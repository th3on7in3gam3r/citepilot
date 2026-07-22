import type { OnboardingAnswers } from "@/lib/onboarding";
import type {
  CitationHistoryPoint,
  SiteSignals,
  PlatformPresence,
  PromptResult,
} from "@/lib/api-types";
import type { ContentCalendarItem } from "@/lib/dashboard-data";
import {
  emptyScanDeltaSummary,
  type ScanDeltaSummary,
} from "@/lib/audit/scan-delta";
import {
  defaultWorkspacePreferences,
  type WorkspacePreferences,
} from "@/lib/settings";

export type DashboardNavItem = {
  id: string;
  label: string;
  href: string;
  description: string;
  icon:
    | "overview"
    | "workspaces"
    | "analytics"
    | "content"
    | "competitors"
    | "backlinks"
    | "audit"
    | "optimizer"
    | "discussions"
    | "alerts"
    | "uptime"
    | "growth-loop"
    | "settings"
    | "help"
    | "feedback";
  section?: "main" | "footer";
  /** Shown on free-tier rail so Pilot/Fleet clicks are not a surprise dead end. */
  badge?: "Pilot" | "Fleet";
};

export const dashboardNav: DashboardNavItem[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/dashboard",
    description: "Citation score, trends, and weekly priorities",
    icon: "overview",
    section: "main",
  },
  {
    id: "workspaces",
    label: "Workspaces",
    href: "/dashboard/workspaces",
    description: "Manage all client workspaces, bulk scans, and exports",
    icon: "workspaces",
    section: "main",
  },
  {
    id: "content",
    label: "Content Studio",
    href: "/dashboard/content",
    description: "Generate articles, manage queue, and publish to CMS",
    icon: "content",
    section: "main",
  },
  {
    id: "analytics",
    label: "Analytics",
    href: "/dashboard/analytics",
    description: "LLM visibility tracking and organic performance",
    icon: "analytics",
    section: "main",
  },
  {
    id: "competitors",
    label: "Competitors",
    href: "/dashboard/competitors",
    description: "Track rivals, prompt gaps, and steal-their-citations actions",
    icon: "competitors",
    section: "main",
  },
  {
    id: "backlinks",
    label: "Backlinks",
    href: "/dashboard/backlinks",
    description: "Authority backlinks through a trusted network",
    icon: "backlinks",
    section: "main",
  },
  {
    id: "geo-audit",
    label: "GEO Audit",
    href: "/dashboard/geo-audit",
    description: "Technical GEO audit — schema, metadata, structure",
    icon: "audit",
    section: "main",
  },
  {
    id: "optimizer",
    label: "Site Optimizer",
    href: "/dashboard/optimizer",
    description: "AI fixes for SEO, AEO, LLM citations, and robots.txt",
    icon: "optimizer",
    section: "main",
    badge: "Pilot",
  },
  {
    id: "discussions",
    label: "Discussions",
    href: "/dashboard/discussions",
    description: "Hacker News & Stack Overflow buyer-intent threads",
    icon: "discussions",
    section: "main",
  },
  {
    id: "alerts",
    label: "Alerts",
    href: "/dashboard/alerts",
    description: "Slack, webhook, and email alert history",
    icon: "alerts",
    section: "main",
  },
  {
    id: "uptime",
    label: "Uptime",
    href: "/dashboard/uptime",
    description: "HTTP, SSL, port, keyword, and cron monitors with instant alerts",
    icon: "uptime",
    section: "main",
    badge: "Pilot",
  },
  {
    id: "growth-loop",
    label: "Growth Loop",
    href: "/dashboard/growth-loop",
    description: "Paste your URL once — daily SEO articles, backlinks, and AI visibility",
    icon: "growth-loop",
    section: "main",
    badge: "Pilot",
  },
  {
    id: "feedback",
    label: "Suggest a feature",
    href: "/dashboard/feedback",
    description: "Upvote ideas and share what to build next",
    icon: "feedback",
    section: "footer",
  },
  {
    id: "settings",
    label: "Settings",
    href: "/dashboard/settings",
    description: "Workspace, prompts, and notifications",
    icon: "settings",
    section: "footer",
  },
  {
    id: "help",
    label: "Help",
    href: "/dashboard/help",
    description: "Guides, docs, and support",
    icon: "help",
    section: "footer",
  },
];

/** Sidebar groupings for the dashboard shell. */
export const dashboardNavGroups: { label: string; itemIds: string[] }[] = [
  {
    label: "Overview",
    itemIds: ["overview", "workspaces"],
  },
  {
    label: "Visibility",
    itemIds: ["analytics", "geo-audit", "optimizer"],
  },
  {
    label: "Research",
    itemIds: ["content", "competitors", "backlinks", "discussions"],
  },
  {
    label: "Operations",
    itemIds: ["growth-loop", "alerts", "uptime"],
  },
  {
    label: "Account",
    itemIds: ["settings", "help", "feedback"],
  },
];

export type WorkspaceSnapshot = {
  domain: string;
  businessType: string;
  description: string;
  audiences: string[];
  competitors: string[];
  buyerQuestion: string;
  preferences: WorkspacePreferences;
  updatedAt: string;
  citationScore: number;
  citedPlatforms: number;
  totalPlatforms: number;
  promptsTracked: number;
  contentDrafts: number;
  sourceCount: number;
  communityMentions: number;
  weeklyLift: string;
  domainRating: number;
  visibilityScore: number;
  gaps: string[];
  auditId: string | null;
  auditMode: "live" | "technical" | null;
  hasRealAudit: boolean;
  workspaceId?: string;
  siteSignals?: SiteSignals | null;
  id?: string;
  promptResults?: PromptResult[];
  platformPresence?: PlatformPresence[];
  citationHistory?: CitationHistoryPoint[];
  contentStrategy?: ContentCalendarItem[];
  contentStrategyGeneratedAt?: string | null;
  weeklyLiftAvailable?: boolean;
  scanDelta?: ScanDeltaSummary;
  freeExplainGapTeaserAvailable?: boolean;
};

export function domainSeed(domain: string): number {
  return domain.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
}

export function buildWorkspaceSnapshot(
  answers: Partial<OnboardingAnswers>,
): WorkspaceSnapshot {
  const domain =
    answers.domain?.replace(/^https?:\/\//, "").replace(/\/$/, "") ||
    "yourbrand.com";
  const promptsTracked = 1 + (answers.buyerQuestion ? 4 : 0);

  return {
    domain,
    businessType: answers.businessType || "saas",
    description: answers.description || "",
    audiences: answers.audiences ?? [],
    competitors: answers.competitors ?? [],
    buyerQuestion:
      answers.buyerQuestion || "best tool for [your category]",
    // No fabricated KPIs — real scores only after hasRealAudit via toSnapshot.
    citationScore: 0,
    citedPlatforms: 0,
    totalPlatforms: PLATFORMS.length,
    promptsTracked,
    contentDrafts: 0,
    sourceCount: 0,
    communityMentions: 0,
    weeklyLift: "—",
    domainRating: 0,
    visibilityScore: 0,
    gaps: [],
    auditId: null,
    auditMode: null,
    hasRealAudit: false,
    siteSignals: null,
    preferences: { ...defaultWorkspacePreferences },
    updatedAt: new Date().toISOString(),
    promptResults: [],
    platformPresence: [],
    citationHistory: [],
    contentStrategy: [],
    contentStrategyGeneratedAt: null,
    weeklyLiftAvailable: false,
    scanDelta: emptyScanDeltaSummary,
    freeExplainGapTeaserAvailable: false,
  };
}

export const PLATFORMS = [
  "ChatGPT",
  "Perplexity",
  "Google AI Overviews",
  "Gemini",
  "Copilot",
  "Claude",
  "Grok",
  "DeepSeek",
] as const;
