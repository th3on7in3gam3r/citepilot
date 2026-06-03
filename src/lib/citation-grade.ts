import type { WorkspaceSnapshot } from "@/lib/dashboard";

export type CitationLetterGrade = "A" | "B" | "C" | "D" | "F";

export function scoreToLetterGrade(score: number): CitationLetterGrade {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  if (s >= 90) return "A";
  if (s >= 80) return "B";
  if (s >= 70) return "C";
  if (s >= 60) return "D";
  return "F";
}

export function letterGradeClassName(grade: CitationLetterGrade): string {
  switch (grade) {
    case "A":
    case "B":
      return "text-emerald-400";
    case "C":
      return "text-amber-400";
    default:
      return "text-rose-400";
  }
}

export function ringStrokeClassName(grade: CitationLetterGrade): string {
  switch (grade) {
    case "A":
    case "B":
      return "stroke-emerald-400";
    case "C":
      return "stroke-amber-400";
    default:
      return "stroke-rose-400";
  }
}

export type ExecutiveBriefingMetrics = {
  letterGrade: CitationLetterGrade;
  citationScore: number;
  promptsCited: number;
  promptsTotal: number;
  promptCitationPct: number | null;
  hasPromptBreakdown: boolean;
  audienceCount: number;
  primaryAudience: string | null;
  platformsCited: number;
  platformsTotal: number;
  platformCoveragePct: number;
  platformsMissing: number;
  planWeeks: number;
  hasGeneratedStrategy: boolean;
};

export function buildExecutiveBriefingMetrics(
  workspace: WorkspaceSnapshot,
): ExecutiveBriefingMetrics {
  const promptResults = workspace.promptResults ?? [];
  const hasPromptBreakdown = promptResults.length > 0;
  const promptsTotal = hasPromptBreakdown
    ? promptResults.length
    : Math.max(workspace.promptsTracked, 0);
  const promptsCited = hasPromptBreakdown
    ? promptResults.filter((p) => p.cited).length
    : 0;

  const promptCitationPct =
    hasPromptBreakdown && promptsTotal > 0
      ? Math.round((promptsCited / promptsTotal) * 100)
      : null;

  const strategyItems = workspace.contentStrategy ?? [];
  const hasGeneratedStrategy = strategyItems.length > 0;
  const planWeeks = hasGeneratedStrategy
    ? new Set(strategyItems.map((item) => item.week)).size
    : 4;

  const platformsTotal = Math.max(workspace.totalPlatforms, 1);
  const platformsCited = Math.min(workspace.citedPlatforms, platformsTotal);
  const platformsMissing = Math.max(platformsTotal - platformsCited, 0);
  const platformCoveragePct = Math.round((platformsCited / platformsTotal) * 100);

  const audiences = workspace.audiences.filter(Boolean);
  const audienceCount = audiences.length;
  const primaryAudience = audiences[0] ?? null;

  return {
    letterGrade: scoreToLetterGrade(workspace.citationScore),
    citationScore: workspace.citationScore,
    promptsCited,
    promptsTotal,
    promptCitationPct,
    hasPromptBreakdown,
    audienceCount,
    primaryAudience,
    platformsCited,
    platformsTotal,
    platformCoveragePct,
    platformsMissing,
    planWeeks,
    hasGeneratedStrategy,
  };
}
