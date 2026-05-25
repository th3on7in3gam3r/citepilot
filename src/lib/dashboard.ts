import type { OnboardingAnswers } from "@/lib/onboarding";
import type { SiteSignals, PlatformPresence, PromptResult } from "@/lib/api-types";
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
    | "analytics"
    | "content"
    | "backlinks"
    | "audit"
    | "discussions"
    | "settings"
    | "help";
  section?: "main" | "footer";
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
    id: "content",
    label: "Content",
    href: "/dashboard/content",
    description: "Branded SEO articles, 30-day strategy, and publishing",
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
    id: "discussions",
    label: "Discussions",
    href: "/dashboard/discussions",
    description: "Hacker News & Stack Overflow buyer-intent threads",
    icon: "discussions",
    section: "main",
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
  const hash = domainSeed(domain);
  const promptsTracked = 1 + (answers.buyerQuestion ? 4 : 0);
  const citedPlatforms = Math.min(PLATFORMS.length, 2 + (hash % 3));

  return {
    domain,
    businessType: answers.businessType || "saas",
    description: answers.description || "",
    audiences: answers.audiences ?? [],
    competitors: answers.competitors ?? [],
    buyerQuestion:
      answers.buyerQuestion || "best tool for [your category]",
    citationScore: Math.min(92, 48 + (hash % 40)),
    citedPlatforms,
    totalPlatforms: PLATFORMS.length,
    promptsTracked,
    contentDrafts: 3,
    sourceCount: 12 + (hash % 8),
    communityMentions: 4 + (hash % 6),
    weeklyLift: "+12.4%",
    domainRating: 12 + (hash % 58),
    visibilityScore: 35 + (hash % 45),
    gaps: [],
    auditId: null,
    auditMode: null,
    hasRealAudit: false,
    siteSignals: null,
    preferences: { ...defaultWorkspacePreferences },
    updatedAt: new Date().toISOString(),
    promptResults: [],
    platformPresence: [],
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
