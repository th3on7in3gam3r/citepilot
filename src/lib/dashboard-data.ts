import type { PlatformPresence, PromptResult } from "@/lib/api-types";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import { domainSeed, PLATFORMS } from "@/lib/dashboard";
import { buildPromptRows, type PromptRow } from "@/lib/features";

export type BenchmarkBrandRow = {
  brand: string;
  avgVisibility: number;
  promptsLed: number;
  deltaVsYou: number;
};

export type BenchmarkPromptRow = {
  prompt: string;
  leader: string;
  yourScore: number;
  gapToLeader: number;
  scores: { brand: string; score: number }[];
};

export type MoneyPromptIdea = {
  prompt: string;
  intent: "comparison" | "alternatives" | "pricing" | "roi" | "buyer-fit" | "implementation";
  reason: string;
};

export type DashboardAlertItem = {
  id: string;
  tone: "critical" | "opportunity" | "info" | "positive";
  title: string;
  body: string;
  href: string;
  cta: string;
};

export type CorrelationInsight = {
  id: string;
  title: string;
  summary: string;
  estimatedLift: string;
  confidence: "High" | "Medium" | "Directional";
  platforms: string[];
  evidence: string[];
};

export function promptRowsForWorkspace(workspace: WorkspaceSnapshot): PromptRow[] {
  if (workspace.promptResults?.length) {
    return workspace.promptResults.map((pr, i) => promptResultToRow(pr, i, workspace));
  }
  return buildPromptRows(workspace.buyerQuestion, domainSeed(workspace.domain));
}

function normalizeBrand(name: string): string {
  return name.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
}

function clampScore(value: number): number {
  return Math.max(4, Math.min(99, Math.round(value)));
}

function promptBenchmarkScores(
  workspace: WorkspaceSnapshot,
  row: PromptRow,
  competitors: string[],
  index: number,
): BenchmarkPromptRow {
  const yourBrand = normalizeBrand(workspace.domain);
  const yourScore = clampScore(row.visibility);
  const promptSeed = domainSeed(`${workspace.domain}-${row.prompt}-${index}`);
  const winningCompetitor =
    row.leader === "You"
      ? null
      : normalizeBrand(
          row.leader === "Competitor" ? competitors[0] ?? "top competitor" : row.leader,
        );

  const scores = [
    {
      brand: yourBrand,
      score: yourScore,
    },
    ...competitors.map((competitor, competitorIndex) => {
      const jitter = ((promptSeed + competitorIndex * 17) % 7) - 3;
      const isWinner = winningCompetitor === competitor;
      const base = row.leader === "You"
        ? yourScore - 10 - competitorIndex * 4 + jitter
        : isWinner
          ? yourScore + 10 + jitter
          : yourScore - 5 - competitorIndex * 4 + jitter;
      return {
        brand: competitor,
        score: clampScore(base),
      };
    }),
  ].sort((a, b) => b.score - a.score);

  const leader = scores[0]?.brand ?? yourBrand;
  return {
    prompt: row.prompt,
    leader,
    yourScore,
    gapToLeader: leader === yourBrand ? 0 : Math.max(0, (scores[0]?.score ?? yourScore) - yourScore),
    scores,
  };
}

export function buildCompetitorBenchmark(
  workspace: WorkspaceSnapshot,
  rows: PromptRow[],
): {
  brands: BenchmarkBrandRow[];
  prompts: BenchmarkPromptRow[];
} {
  const yourBrand = normalizeBrand(workspace.domain);
  const competitors = workspace.competitors
    .map(normalizeBrand)
    .filter(Boolean)
    .slice(0, 3);

  if (competitors.length === 0) {
    return {
      brands: [],
      prompts: [],
    };
  }

  const prompts = rows.map((row, index) =>
    promptBenchmarkScores(workspace, row, competitors, index),
  );

  const brands = [yourBrand, ...competitors].map((brand) => {
    const brandScores = prompts.map(
      (prompt) => prompt.scores.find((score) => score.brand === brand)?.score ?? 0,
    );
    const promptsLed = prompts.filter((prompt) => prompt.leader === brand).length;
    const avgVisibility =
      brandScores.reduce((sum, score) => sum + score, 0) /
      Math.max(1, brandScores.length);

    return {
      brand,
      avgVisibility: clampScore(avgVisibility),
      promptsLed,
      deltaVsYou: 0,
    };
  });

  const yourAverage =
    brands.find((brand) => brand.brand === yourBrand)?.avgVisibility ?? workspace.visibilityScore;

  return {
    brands: brands.map((brand) => ({
      ...brand,
      deltaVsYou: brand.avgVisibility - yourAverage,
    })),
    prompts,
  };
}

function businessPhrase(businessType: string): string {
  switch (businessType) {
    case "saas":
      return "software";
    case "agency":
      return "agency partner";
    case "ecommerce":
      return "ecommerce platform";
    case "local":
      return "local service";
    case "creator":
      return "creator tool";
    default:
      return "solution";
  }
}

function audiencePhrase(workspace: WorkspaceSnapshot): string {
  const first = workspace.audiences[0];
  if (!first) return "teams";
  return first.replace(/-/g, " ");
}

export function buildMoneyPromptIdeas(
  workspace: WorkspaceSnapshot,
): MoneyPromptIdea[] {
  const yourBrand = normalizeBrand(workspace.domain);
  const competitor = normalizeBrand(workspace.competitors[0] ?? "top competitor");
  const phrase = businessPhrase(workspace.businessType);
  const audience = audiencePhrase(workspace);
  const buyerQuestion = workspace.buyerQuestion || `best ${phrase} for ${audience}`;

  return [
    {
      prompt: buyerQuestion,
      intent: "buyer-fit",
      reason: "Closest to the question your ideal buyer is already asking before a shortlist forms.",
    },
    {
      prompt: `alternatives to ${competitor}`,
      intent: "alternatives",
      reason: "Captures buyers who are actively comparing vendors and ready to switch.",
    },
    {
      prompt: `${yourBrand} vs ${competitor}`,
      intent: "comparison",
      reason: "Shows whether you are winning high-intent head-to-head prompts against a tracked competitor.",
    },
    {
      prompt: `${yourBrand} pricing`,
      intent: "pricing",
      reason: "Pricing prompts reveal bottom-funnel intent and usually influence conversion quality fast.",
    },
    {
      prompt: `is ${yourBrand} worth it for ${audience}`,
      intent: "roi",
      reason: "Targets ROI skepticism prompts that often appear just before purchase or demo requests.",
    },
    {
      prompt: `how to choose ${phrase} for ${audience}`,
      intent: "implementation",
      reason: "Useful for educational buying journeys where the user needs criteria before picking a vendor.",
    },
  ];
}

export function buildDashboardAlerts(
  workspace: WorkspaceSnapshot,
  rows: PromptRow[],
): DashboardAlertItem[] {
  const alerts: DashboardAlertItem[] = [];
  const platformRows = platformRowsFromWorkspace(workspace, PLATFORMS);
  const missingPlatforms = platformRows.filter((platform) => !platform.cited);
  const benchmark = buildCompetitorBenchmark(workspace, rows);
  const gapPrompts = benchmark.prompts
    .filter((prompt) => prompt.gapToLeader > 0)
    .sort((a, b) => b.gapToLeader - a.gapToLeader);
  const topGap = gapPrompts[0];
  const daysSinceUpdate = Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(workspace.updatedAt).getTime()) / (1000 * 60 * 60 * 24),
    ),
  );

  if (!workspace.hasRealAudit) {
    alerts.push({
      id: "audit-needed",
      tone: "info",
      title: "Run a live audit to unlock stronger alerting",
      body: "This workspace is still using projected citation data. A fresh audit will give you real prompt, platform, and report signals to monitor.",
      href: "/audit",
      cta: "Run audit",
    });
  } else if (daysSinceUpdate >= 14) {
    alerts.push({
      id: "audit-refresh",
      tone: "info",
      title: "Your last workspace update is getting stale",
      body: `It has been about ${daysSinceUpdate} days since this workspace was last updated. Re-running an audit will tighten the benchmark and proof report.`,
      href: "/audit",
      cta: "Refresh audit",
    });
  }

  if (topGap) {
    alerts.push({
      id: "competitor-gap",
      tone: topGap.gapToLeader >= 10 ? "critical" : "opportunity",
      title: `${topGap.leader} is ahead on tracked comparison prompts`,
      body: `A competitor currently leads ${gapPrompts.length} tracked prompt${gapPrompts.length === 1 ? "" : "s"}. Your biggest gap is ${topGap.gapToLeader} points on "${topGap.prompt}".`,
      href: "/dashboard/analytics",
      cta: "Review benchmark",
    });
  }

  if (missingPlatforms.length >= 2) {
    alerts.push({
      id: "platform-coverage",
      tone: "opportunity",
      title: "You are still missing on several AI platforms",
      body: `Coverage is currently missing on ${missingPlatforms.length} platforms: ${missingPlatforms
        .slice(0, 3)
        .map((platform) => platform.name)
        .join(", ")}${missingPlatforms.length > 3 ? ", and more" : ""}.`,
      href: "/dashboard/geo-audit",
      cta: "See action plan",
    });
  }

  if (workspace.communityMentions >= 4 && !workspace.preferences.discussionAlerts) {
    alerts.push({
      id: "discussion-alerts-off",
      tone: "info",
      title: "Discussion alerts are off",
      body: `This workspace already has ${workspace.communityMentions} community signals, but discussion opportunity alerts are disabled in Settings.`,
      href: "/dashboard/settings",
      cta: "Enable alerts",
    });
  }

  if (workspace.hasRealAudit) {
    alerts.push({
      id: "proof-report-ready",
      tone: "positive",
      title: "Your stakeholder proof report is ready",
      body: "Share current platform coverage, competitor benchmarks, and prompt-level proof from the export-friendly report page.",
      href: "/report/proof",
      cta: "Open report",
    });
  }

  return alerts.slice(0, 4);
}

export function buildCorrelationInsights(
  workspace: WorkspaceSnapshot,
  rows: PromptRow[],
): CorrelationInsight[] {
  const insights: CorrelationInsight[] = [];
  const benchmark = buildCompetitorBenchmark(workspace, rows);
  const gapPrompts = benchmark.prompts
    .filter((prompt) => prompt.gapToLeader > 0)
    .sort((a, b) => b.gapToLeader - a.gapToLeader);
  const topGap = gapPrompts[0];
  const platforms = platformRowsFromWorkspace(workspace, PLATFORMS);
  const missingPlatforms = platforms.filter((platform) => !platform.cited);
  const citedPlatforms = platforms.filter((platform) => platform.cited);
  const signals = workspace.siteSignals;

  if (signals) {
    if (!signals.hasFaqSchema) {
      insights.push({
        id: "faq-schema-gap",
        title: "FAQ schema gap correlates with weaker answer inclusion",
        summary:
          "Pages without FAQ-style structured answers tend to lose visibility on buyer questions that need concise answer blocks.",
        estimatedLift: "+6% to +12%",
        confidence: workspace.hasRealAudit ? "High" : "Directional",
        platforms: ["Google AI Overviews", "ChatGPT", "Perplexity"],
        evidence: [
          "FAQ schema not detected on the audited page",
          `Current GEO score is ${signals.geoScore}/100`,
          `Tracked buyer prompt: "${workspace.buyerQuestion}"`,
        ],
      });
    }

    if (!signals.hasOrganizationSchema || !signals.hasJsonLd) {
      insights.push({
        id: "entity-structure",
        title: "Entity structure likely limits citation trust",
        summary:
          "Weak or missing JSON-LD often correlates with lower entity confidence, especially when platforms are deciding whether to cite a brand directly.",
        estimatedLift: "+4% to +9%",
        confidence: workspace.hasRealAudit ? "High" : "Directional",
        platforms: ["ChatGPT", "Claude", "Grok"],
        evidence: [
          signals.hasJsonLd ? "JSON-LD detected" : "JSON-LD missing",
          signals.hasOrganizationSchema
            ? "Organization schema detected"
            : "Organization schema missing",
          `${missingPlatforms.length} AI platform${missingPlatforms.length === 1 ? "" : "s"} still missing`,
        ],
      });
    }
  }

  if (topGap) {
    insights.push({
      id: "comparison-gap",
      title: "Comparison intent appears to be your biggest growth lever",
      summary:
        "The widest benchmark gap is on a tracked comparison-style prompt, which usually means the fastest lift comes from comparison pages, pricing clarity, and stronger answer formatting.",
      estimatedLift: `+${Math.min(18, topGap.gapToLeader + 3)} pts on "${topGap.prompt}"`,
      confidence: gapPrompts.length >= 2 ? "Medium" : "Directional",
      platforms: citedPlatforms.slice(0, 3).map((platform) => platform.name),
      evidence: [
        `${topGap.leader} currently leads this prompt by ${topGap.gapToLeader} points`,
        `${gapPrompts.length} tracked prompts are still led by competitors`,
        workspace.competitors[0]
          ? `Top tracked competitor: ${workspace.competitors[0]}`
          : "Competitor benchmarking enabled",
      ],
    });
  }

  if (missingPlatforms.length >= 2) {
    insights.push({
      id: "platform-coverage",
      title: "Coverage gaps suggest content formatting is uneven across models",
      summary:
        "When several platforms still miss your brand entirely, the issue is often not just authority but answer structure, comparison intent coverage, and reusable citations.",
      estimatedLift: `+${missingPlatforms.length * 2}% cross-platform coverage`,
      confidence: "Directional",
      platforms: missingPlatforms.slice(0, 3).map((platform) => platform.name),
      evidence: [
        `${missingPlatforms.length} platforms currently show no presence`,
        `${workspace.citedPlatforms}/${workspace.totalPlatforms} platforms cited overall`,
        `${workspace.sourceCount} referring pages and ${workspace.communityMentions} community signals tracked`,
      ],
    });
  }

  if (workspace.hasRealAudit && workspace.gaps.length <= 2 && workspace.visibilityScore >= 55) {
    insights.push({
      id: "stability-signal",
      title: "Technical cleanup is already compounding into steadier visibility",
      summary:
        "This workspace is starting from a relatively stronger technical base, which usually means the next gains come from prompt expansion and competitive content, not only more fixes.",
      estimatedLift: "+5% to +10% from prompt expansion",
      confidence: "Medium",
      platforms: citedPlatforms.slice(0, 3).map((platform) => platform.name),
      evidence: [
        `Visibility score is ${workspace.visibilityScore}%`,
        `${workspace.gaps.length} priority gap${workspace.gaps.length === 1 ? "" : "s"} remain`,
        `${workspace.promptsTracked} prompts already tracked`,
      ],
    });
  }

  return insights.slice(0, 4);
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
  const normalizePlatformKey = (name: string) =>
    name.toLowerCase().replace(/overviews/g, "").replace(/ai/g, "").replace(/\s+/g, "");

  if (workspace.platformPresence?.length) {
    const seen = new Set<string>();
    const rows = workspace.platformPresence.map((p) => {
      seen.add(normalizePlatformKey(p.name));
      return {
        name: p.name,
        cited: p.present,
        share: p.share,
      };
    });
    const missingFallbacks = fallbackNames
      .filter((name) => !seen.has(normalizePlatformKey(name)))
      .map((name) => ({ name, cited: false as const }));

    return [...rows, ...missingFallbacks];
  }
  return fallbackNames.map((name, i) => ({
    name,
    cited: i < workspace.citedPlatforms,
  }));
}
