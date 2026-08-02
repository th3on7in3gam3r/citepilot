export type MoneyPromptEngine =
  | "chatgpt"
  | "perplexity"
  | "gemini"
  | "google-ai-overview";

export type PromptIntent =
  | "transactional"
  | "comparison"
  | "best-of"
  | "near-me"
  | "review"
  | "how-to-buy";

export type MoneyPromptStatus = "draft" | "active" | "cited" | "archived";

export type GapReason =
  | "no-content"
  | "weak-schema"
  | "missing-llms-txt"
  | "thin-authority"
  | "no-comparison-page"
  | "stale-content";

export type CitationGapStatus = "open" | "in-progress" | "fixed" | "ignored";

/** Workspace-shaped brand context for generation / gap analysis. */
export type MoneyPromptBrand = {
  id: string;
  userId: string;
  name: string;
  domain: string;
  description?: string;
};

export type CompetitorCitation = {
  name: string;
  url: string;
  snippet: string;
};

export type MoneyPrompt = {
  id: string;
  workspaceId: string;
  userId: string;
  query: string;
  intent: PromptIntent;
  promptText: string;
  targetEngines: MoneyPromptEngine[];
  moneyScore: number;
  status: MoneyPromptStatus;
  createdAt: string;
  updatedAt: string;
};

export type MoneyPromptCheck = {
  id: string;
  promptId: string;
  engine: MoneyPromptEngine;
  brandCited: boolean;
  competitorsCited: CompetitorCitation[];
  rawResponse?: string | null;
  checkedAt: string;
};

export type CitationGap = {
  id: string;
  workspaceId: string;
  userId: string;
  moneyPromptId?: string | null;
  query: string;
  engine: MoneyPromptEngine;
  brandCited: boolean;
  competitorsCited: CompetitorCitation[];
  gapReason: GapReason | null;
  suggestedFix: string | null;
  priority: 1 | 2 | 3 | 4 | 5;
  status: CitationGapStatus;
  createdAt: string;
};

export const PROMPT_INTENTS: PromptIntent[] = [
  "transactional",
  "comparison",
  "best-of",
  "near-me",
  "review",
  "how-to-buy",
];

export const DEFAULT_TARGET_ENGINES: MoneyPromptEngine[] = [
  "chatgpt",
  "perplexity",
  "gemini",
  "google-ai-overview",
];
