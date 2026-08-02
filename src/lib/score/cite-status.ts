import type { WorkspaceSnapshot } from "@/lib/dashboard";

export type CiteStatusTierId = "gap" | "emerging" | "cite-ready" | "highly-citeable";

export type CiteStatusTier = {
  id: CiteStatusTierId;
  rank: number;
  label: string;
  description: string;
  celebration: string;
  nextTierLabel: string | null;
  nextTierAt: number | null;
  badgeClass: string;
  progressClass: string;
};

const TIERS: CiteStatusTier[] = [
  {
    id: "gap",
    rank: 0,
    label: "Citation gap",
    description: "AI rarely cites you yet — close the top GEO gaps to become visible.",
    celebration: "You started closing the citation gap.",
    nextTierLabel: "Emerging",
    nextTierAt: 41,
    badgeClass: "border-red-200 bg-red-50 text-red-800",
    progressClass: "bg-red-500",
  },
  {
    id: "emerging",
    rank: 1,
    label: "Emerging",
    description: "You show up on some prompts — keep publishing and fixing entity signals.",
    celebration: "Your site is emerging in AI answers.",
    nextTierLabel: "Cite-ready",
    nextTierAt: 71,
    badgeClass: "border-amber-200 bg-amber-50 text-amber-900",
    progressClass: "bg-amber-500",
  },
  {
    id: "cite-ready",
    rank: 2,
    label: "Cite-ready",
    description: "Strong GEO foundation — buyers can find you on multiple AI surfaces.",
    celebration: "Your site is cite-ready across AI engines.",
    nextTierLabel: "Highly cite-able",
    nextTierAt: 86,
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
    progressClass: "bg-emerald-500",
  },
  {
    id: "highly-citeable",
    rank: 3,
    label: "Highly cite-able",
    description: "Top-tier AI visibility — share your score page and keep publishing.",
    celebration: "Highly cite-able — you're a top AI-visible brand.",
    nextTierLabel: null,
    nextTierAt: null,
    badgeClass: "border-sky-200 bg-gradient-to-r from-sky-50 to-emerald-50 text-sky-900 ring-1 ring-sky-200/80",
    progressClass: "bg-sky-500",
  },
];

export function citeStatusTier(score: number): CiteStatusTier {
  if (score >= 86) return TIERS[3]!;
  if (score >= 71) return TIERS[2]!;
  if (score >= 41) return TIERS[1]!;
  return TIERS[0]!;
}

export function citeStatusTierById(id: string): CiteStatusTier | null {
  return TIERS.find((tier) => tier.id === id) ?? null;
}

export function progressWithinTier(score: number): {
  percent: number;
  label: string;
} {
  const tier = citeStatusTier(score);
  if (tier.nextTierAt == null) {
    return { percent: 100, label: "Top tier unlocked" };
  }

  const floor =
    tier.id === "gap" ? 0 : tier.id === "emerging" ? 41 : tier.id === "cite-ready" ? 71 : 86;
  const ceiling = tier.nextTierAt;
  const percent = Math.round(((score - floor) / (ceiling - floor)) * 100);
  const clamped = Math.max(0, Math.min(100, percent));

  return {
    percent: clamped,
    label: `${clamped}% to ${tier.nextTierLabel}`,
  };
}

export type CiteMilestoneId =
  | "first-audit"
  | "first-citation"
  | "multi-platform"
  | "score-lift"
  | "cite-ready"
  | "highly-citeable";

export type CiteMilestone = {
  id: CiteMilestoneId;
  label: string;
  hint: string;
  unlocked: boolean;
};

export function citeStatusMilestones(workspace: WorkspaceSnapshot): CiteMilestone[] {
  const score = workspace.citationScore;
  const citedPrompts =
    workspace.promptResults?.filter((prompt) => prompt.cited).length ?? 0;
  const scoreLift = workspace.scanDelta?.scoreDelta ?? 0;

  return [
    {
      id: "first-audit",
      label: "First audit",
      hint: "Run your first GEO audit",
      unlocked: workspace.hasRealAudit,
    },
    {
      id: "first-citation",
      label: "First citation",
      hint: "Get cited on any AI platform",
      unlocked: citedPrompts > 0 || workspace.citedPlatforms > 0,
    },
    {
      id: "multi-platform",
      label: "3+ platforms",
      hint: "Show up on three AI engines",
      unlocked: workspace.citedPlatforms >= 3,
    },
    {
      id: "score-lift",
      label: "+10 score lift",
      hint: "Improve your score by 10 points",
      unlocked: scoreLift >= 10,
    },
    {
      id: "cite-ready",
      label: "Cite-ready",
      hint: "Reach a score of 71+",
      unlocked: score >= 71,
    },
    {
      id: "highly-citeable",
      label: "Highly cite-able",
      hint: "Reach a score of 86+",
      unlocked: score >= 86,
    },
  ];
}

export function isCiteStatusUpgrade(
  previousTierId: string | null,
  score: number,
): { upgraded: boolean; tier: CiteStatusTier; previous: CiteStatusTier | null } {
  const tier = citeStatusTier(score);
  const previous = previousTierId ? citeStatusTierById(previousTierId) : null;
  return {
    upgraded: previous != null && tier.rank > previous.rank,
    tier,
    previous,
  };
}
