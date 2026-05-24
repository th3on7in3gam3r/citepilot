import type { PlatformPresence, PromptResult } from "@/lib/api-types";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import { domainSeed } from "@/lib/dashboard";
import { buildPromptRows, type PromptRow } from "@/lib/features";

export function promptRowsForWorkspace(workspace: WorkspaceSnapshot): PromptRow[] {
  if (workspace.promptResults?.length) {
    return workspace.promptResults.map((pr, i) => promptResultToRow(pr, i, workspace));
  }
  return buildPromptRows(workspace.buyerQuestion, domainSeed(workspace.domain));
}

function promptResultToRow(
  pr: PromptResult,
  index: number,
  workspace: WorkspaceSnapshot,
): PromptRow {
  const citedModels = workspace.platformPresence
    ?.filter((p) => p.present)
    .slice(0, 3)
    .map((p) => p.name.split(" ")[0]?.slice(0, 2) ?? "AI") ?? ["GPT", "Px"];

  return {
    prompt: pr.prompt,
    visibility: pr.cited
      ? Math.min(95, workspace.citationScore + 5 - index * 3)
      : Math.max(8, workspace.visibilityScore - 15 - index * 5),
    models: pr.cited ? citedModels : citedModels.slice(0, 1),
    sentiment: pr.cited ? "Positive" : index % 2 === 0 ? "Neutral" : "Negative",
    leader: pr.cited ? "You" : workspace.competitors[0] ?? "Competitor",
  };
}

export type ContentCalendarItem = {
  week: string;
  topic: string;
  format: string;
  rationale: string;
};

export function buildContentCalendar(workspace: WorkspaceSnapshot): ContentCalendarItem[] {
  const q = workspace.buyerQuestion || "your top buyer question";
  const comp = workspace.competitors[0] ?? "top competitor";
  const gap = workspace.gaps[0];

  const items: ContentCalendarItem[] = [
    {
      week: "Week 1",
      topic: `Answer guide: ${q}`,
      format: "Pillar",
      rationale: "Closes your primary citation gap",
    },
    {
      week: "Week 2",
      topic: `${workspace.domain} vs ${comp}`,
      format: "Comparison",
      rationale: "Captures alternative-intent prompts",
    },
    {
      week: "Week 3",
      topic: gap
        ? `Fix: ${gap.slice(0, 60)}${gap.length > 60 ? "…" : ""}`
        : "FAQ: pricing, implementation, and ROI",
      format: "FAQ",
      rationale: "Targets GEO schema and answer capsules",
    },
    {
      week: "Week 4",
      topic: `Case study — results with ${workspace.domain}`,
      format: "Proof",
      rationale: "Builds entity trust for AI citations",
    },
  ];

  return items;
}

export type ArticleDraft = {
  title: string;
  status: "Draft" | "In review" | "Suggested";
  score: number;
  target: string;
};

export function buildArticleDrafts(workspace: WorkspaceSnapshot): ArticleDraft[] {
  const seed = domainSeed(workspace.domain);
  const comp = workspace.competitors[0] ?? "[competitor]";

  return [
    {
      title: `Best tools for: ${workspace.buyerQuestion.slice(0, 48)}`,
      status: "Draft",
      score: Math.min(95, workspace.citationScore + 6),
      target: workspace.buyerQuestion,
    },
    {
      title: `Why teams switch from ${comp}`,
      status: "In review",
      score: Math.min(90, 70 + (seed % 15)),
      target: `alternatives to ${comp}`,
    },
    {
      title: workspace.gaps[1]
        ? `GEO fix playbook for ${workspace.domain}`
        : `How to choose ${workspace.businessType} software`,
      status: "Suggested",
      score: Math.min(98, workspace.visibilityScore + 12),
      target: workspace.buyerQuestion,
    },
  ];
}

export function platformRowsFromWorkspace(
  workspace: WorkspaceSnapshot,
  fallbackNames: readonly string[],
): { name: string; cited: boolean; share?: number }[] {
  if (workspace.platformPresence?.length) {
    return workspace.platformPresence.map((p) => ({
      name: p.name,
      cited: p.present,
      share: p.share,
    }));
  }
  return fallbackNames.map((name, i) => ({
    name,
    cited: i < workspace.citedPlatforms,
  }));
}
