import type { OnboardingAnswers } from "@/lib/onboarding";
import type { ScanDeltaSummary } from "@/lib/audit/scan-delta";
import type { ContentCalendarItem } from "@/lib/dashboard-data";
import type { WorkspacePreferences } from "@/lib/settings";

export type SiteSignals = {
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  /** First ~3k chars of visible homepage text — used for prompt overlap checks. */
  bodyExcerpt?: string | null;
  wordCount: number;
  hasJsonLd: boolean;
  hasFaqSchema: boolean;
  hasOrganizationSchema: boolean;
  hasOgTags: boolean;
  robotsAllows: boolean;
  sitemapFound: boolean;
  fetchOk: boolean;
  geoScore: number;
};

export type PlatformPresence = {
  name: string;
  present: boolean;
  share: number;
};

export type PromptResult = {
  prompt: string;
  cited: boolean;
  reason: string;
};

export type CitationHistoryPoint = {
  recordedAt: string;
  visibilityIndex: number;
};

export type AuditPayload = {
  id: string;
  domain: string;
  score: number;
  cited: number;
  total: number;
  platforms: PlatformPresence[];
  gaps: string[];
  competitors: string[];
  siteSignals: SiteSignals;
  mode: "live" | "technical";
  promptResults: PromptResult[];
  workspaceId: string | null;
  createdAt: string;
};

export type WorkspacePayload = OnboardingAnswers & {
  id: string;
  createdAt: string;
  updatedAt: string;
  preferences: WorkspacePreferences;
  latestAudit: AuditPayload | null;
};

export type WorkspaceUpdateInput = Partial<OnboardingAnswers> & {
  preferences?: Partial<WorkspacePreferences>;
  displayName?: string;
  status?: "active" | "paused";
  archived?: boolean;
};

export type WorkspaceSnapshotResponse = {
  id: string;
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
  siteSignals: SiteSignals | null;
  hasRealAudit: boolean;
  promptResults: PromptResult[];
  platformPresence: PlatformPresence[];
  citationHistory: CitationHistoryPoint[];
  contentStrategy: ContentCalendarItem[];
  contentStrategyGeneratedAt: string | null;
  weeklyLiftAvailable: boolean;
  scanDelta: ScanDeltaSummary;
  /** Free plan: one explain-gap Insight after first real audit */
  freeExplainGapTeaserAvailable: boolean;
};

export type RedditThread = DiscussionThread;

export type DiscussionThread = {
  id: string;
  title: string;
  source: "hackernews" | "stackexchange" | "serper" | "serpapi" | "tavily";
  sourceLabel: string;
  url: string;
  score: number;
  comments: number;
};

export type WaitlistEntry = {
  id: string;
  email: string;
  createdAt: string;
};

export type AdminAuditRow = {
  id: string;
  domain: string;
  workspaceId: string | null;
  score: number;
  cited: number;
  total: number;
  mode: string;
  createdAt: string;
};
