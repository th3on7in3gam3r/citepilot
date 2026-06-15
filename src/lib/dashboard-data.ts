import type { PromptResult } from "@/lib/api-types";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import { domainSeed, PLATFORMS } from "@/lib/dashboard";
import { buildPromptRows, type PromptRow } from "@/lib/features";
import type { EditorialPillarId } from "@/lib/content-strategy";
import {
  pillarForCalendarFormat,
  pillarForMoneyPromptIntent,
} from "@/lib/content-strategy/suggestions";

export type BenchmarkBrandRow = {
  brand: string;
  avgVisibility: number | null;
  promptsLed: number;
  deltaVsYou: number | null;
  measured: boolean;
};

export type BenchmarkPromptRow = {
  prompt: string;
  leader: string;
  yourScore: number | null;
  gapToLeader: number | null;
  youCited: boolean;
  scores: { brand: string; score: number | null; measured: boolean }[];
};

export type CompetitorBenchmarkResult = {
  available: boolean;
  unavailableReason?: string;
  brands: BenchmarkBrandRow[];
  prompts: BenchmarkPromptRow[];
};

export type MoneyPromptIdea = {
  prompt: string;
  intent: "comparison" | "alternatives" | "pricing" | "roi" | "buyer-fit" | "implementation";
  reason: string;
  pillar: EditorialPillarId;
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
  /** Omitted when lift cannot be measured from stored data. */
  estimatedLift?: string;
  confidence: "High" | "Medium" | "Directional";
  platforms: string[];
  evidence: string[];
};

export function promptRowsForWorkspace(workspace: WorkspaceSnapshot): PromptRow[] {
  if (workspace.promptResults?.length) {
    return workspace.promptResults.map((pr, i) => promptResultToRow(pr, i, workspace));
  }
  if (!workspace.hasRealAudit) {
    return [];
  }
  return buildPromptRows(workspace.buyerQuestion, domainSeed(workspace.domain));
}

function normalizeBrand(name: string): string {
  return name.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
}

function promptBenchmarkFromAudit(
  workspace: WorkspaceSnapshot,
  row: PromptRow,
  competitors: string[],
): BenchmarkPromptRow {
  const yourBrand = normalizeBrand(workspace.domain);
  const youCited = row.cited ?? row.leader === "You";
  const yourScore = youCited ? 100 : 0;
  const leader =
    row.leader === "You"
      ? yourBrand
      : normalizeBrand(
          row.leader === "Competitor"
            ? competitors[0] ?? "Competitor"
            : row.leader,
        );

  const scores = [
    { brand: yourBrand, score: yourScore, measured: true },
    ...competitors.map((competitor) => ({
      brand: competitor,
      score: null,
      measured: false,
    })),
  ];

  return {
    prompt: row.prompt,
    leader,
    yourScore,
    youCited,
    gapToLeader: youCited ? 0 : null,
    scores,
  };
}

export function buildCompetitorBenchmark(
  workspace: WorkspaceSnapshot,
  rows: PromptRow[],
): CompetitorBenchmarkResult {
  const yourBrand = normalizeBrand(workspace.domain);
  const competitors = workspace.competitors
    .map(normalizeBrand)
    .filter(Boolean)
    .slice(0, 3);

  if (!workspace.hasRealAudit) {
    return {
      available: false,
      unavailableReason:
        "Run a citation audit to unlock prompt-level benchmarking from live audit results.",
      brands: [],
      prompts: [],
    };
  }

  if (competitors.length === 0) {
    return {
      available: false,
      unavailableReason:
        "Add competitors in Settings to compare your audited prompts against tracked rivals.",
      brands: [],
      prompts: [],
    };
  }

  const auditRows = rows.filter((row) => row.fromAudit);
  if (auditRows.length === 0) {
    return {
      available: false,
      unavailableReason:
        "No audited prompts are available yet. Re-run a citation audit to refresh benchmark data.",
      brands: [],
      prompts: [],
    };
  }

  const prompts = auditRows.map((row) =>
    promptBenchmarkFromAudit(workspace, row, competitors),
  );

  const yourPromptsLed = prompts.filter((prompt) => prompt.youCited).length;
  const yourAverage =
    prompts.length > 0
      ? Math.round(
          prompts.reduce((sum, prompt) => sum + (prompt.yourScore ?? 0), 0) /
            prompts.length,
        )
      : null;

  const brands: BenchmarkBrandRow[] = [
    {
      brand: yourBrand,
      avgVisibility: yourAverage,
      promptsLed: yourPromptsLed,
      deltaVsYou: 0,
      measured: true,
    },
    ...competitors.map((competitor) => ({
      brand: competitor,
      avgVisibility: null,
      promptsLed: prompts.filter((prompt) => prompt.leader === competitor).length,
      deltaVsYou: null,
      measured: false,
    })),
  ];

  return {
    available: true,
    unavailableReason:
      "Competitor visibility scores require dedicated competitor scans. Your cite status per prompt is from your latest audit.",
    brands,
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
      pillar: pillarForMoneyPromptIntent("buyer-fit"),
    },
    {
      prompt: `alternatives to ${competitor}`,
      intent: "alternatives",
      reason: "Captures buyers who are actively comparing vendors and ready to switch.",
      pillar: pillarForMoneyPromptIntent("alternatives"),
    },
    {
      prompt: `${yourBrand} vs ${competitor}`,
      intent: "comparison",
      reason: "Shows whether you are winning high-intent head-to-head prompts against a tracked competitor.",
      pillar: pillarForMoneyPromptIntent("comparison"),
    },
    {
      prompt: `${yourBrand} pricing`,
      intent: "pricing",
      reason: "Pricing prompts reveal bottom-funnel intent and usually influence conversion quality fast.",
      pillar: pillarForMoneyPromptIntent("pricing"),
    },
    {
      prompt: `is ${yourBrand} worth it for ${audience}`,
      intent: "roi",
      reason: "Targets ROI skepticism prompts that often appear just before purchase or demo requests.",
      pillar: pillarForMoneyPromptIntent("roi"),
    },
    {
      prompt: `how to choose ${phrase} for ${audience}`,
      intent: "implementation",
      reason: "Useful for educational buying journeys where the user needs criteria before picking a vendor.",
      pillar: pillarForMoneyPromptIntent("implementation"),
    },
  ];
}

export function buildDashboardAlerts(
  workspace: WorkspaceSnapshot,
): DashboardAlertItem[] {
  const alerts: DashboardAlertItem[] = [];
  const platformRows = platformRowsFromWorkspace(workspace, PLATFORMS);
  const missingPlatforms = platformRows.filter((platform) => !platform.cited);
  const uncitedPrompts = (workspace.promptResults ?? []).filter((pr) => !pr.cited);
  const topUncited = uncitedPrompts[0];
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

  if (workspace.hasRealAudit && uncitedPrompts.length > 0) {
    alerts.push({
      id: "prompt-coverage",
      tone: uncitedPrompts.length >= 2 ? "critical" : "opportunity",
      title: `${uncitedPrompts.length} audited prompt${uncitedPrompts.length === 1 ? "" : "s"} not citing your brand`,
      body: topUncited
        ? `Latest audit did not cite you on "${topUncited.prompt}". Strengthen answer pages and comparison content for these buyer questions.`
        : "Your latest audit found prompts where your brand is not cited on live AI surfaces.",
      href: "/dashboard/analytics",
      cta: "Review prompts",
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

  if (
    workspace.communityMentions > 0 &&
    !workspace.preferences.discussionAlerts
  ) {
    alerts.push({
      id: "discussion-alerts-off",
      tone: "info",
      title: "Discussion alerts are off",
      body: `Discussion opportunity alerts are disabled in Settings while ${workspace.communityMentions} community signal${workspace.communityMentions === 1 ? "" : "s"} are available on the Discussions tab.`,
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
  if (!workspace.hasRealAudit) {
    return [];
  }

  const insights: CorrelationInsight[] = [];
  const uncitedCount = (workspace.promptResults ?? []).filter((pr) => !pr.cited).length;
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
        confidence: "High",
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
        confidence: "High",
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

  if (uncitedCount > 0) {
    const uncited = workspace.promptResults?.filter((pr) => !pr.cited) ?? [];
    insights.push({
      id: "uncited-prompts",
      title: "Uncited buyer prompts are the clearest near-term lever",
      summary:
        "Your latest audit found prompts where your brand is not cited. Comparison pages, pricing clarity, and FAQ-style answer blocks are the usual fixes.",
      confidence: uncitedCount >= 2 ? "High" : "Medium",
      platforms: citedPlatforms.slice(0, 3).map((platform) => platform.name),
      evidence: [
        `${uncitedCount} of ${workspace.promptResults?.length ?? rows.length} audited prompts did not cite your brand`,
        uncited[0] ? `Example: "${uncited[0].prompt}"` : "Review prompt results in Analytics",
        workspace.competitors[0]
          ? `Tracked competitor for content: ${workspace.competitors[0]}`
          : "Add competitors in Settings for sharper content targets",
      ],
    });
  }

  if (missingPlatforms.length >= 2) {
    insights.push({
      id: "platform-coverage",
      title: "Several AI platforms still show no presence",
      summary:
        "When multiple surfaces miss your brand, prioritize answer structure, entity markup, and comparison-intent pages—not only net-new blog volume.",
      confidence: "Medium",
      platforms: missingPlatforms.slice(0, 3).map((platform) => platform.name),
      evidence: [
        `${missingPlatforms.length} platforms currently show no presence`,
        `${workspace.citedPlatforms}/${workspace.totalPlatforms} platforms cited in the latest audit`,
        workspace.auditMode === "live"
          ? "Latest audit used live platform checks where API keys are configured"
          : "Latest audit used technical signals — add API keys for live platform probes",
      ],
    });
  }

  if (workspace.gaps.length <= 2 && workspace.visibilityScore >= 55) {
    insights.push({
      id: "stability-signal",
      title: "Technical base is relatively strong — focus on prompt expansion",
      summary:
        "GEO signals are in decent shape. The next gains likely come from new comparison and FAQ content tied to audited buyer prompts.",
      confidence: "Medium",
      platforms: citedPlatforms.slice(0, 3).map((platform) => platform.name),
      evidence: [
        `GEO visibility score is ${workspace.visibilityScore}/100`,
        `${workspace.gaps.length} priority gap${workspace.gaps.length === 1 ? "" : "s"} remain from the latest audit`,
        `${workspace.promptResults?.length ?? 0} prompts in the latest audit`,
      ],
    });
  }

  return insights.slice(0, 4);
}

function promptResultToRow(
  pr: PromptResult,
  _index: number,
  workspace: WorkspaceSnapshot,
): PromptRow {
  const citedModels = workspace.platformPresence
    ?.filter((p) => p.present)
    .slice(0, 3)
    .map((p) => p.name.split(" ")[0]?.slice(0, 2) ?? "AI") ?? ["GPT", "Px"];

  return {
    prompt: pr.prompt,
    visibility: pr.cited ? 100 : 0,
    models: pr.cited ? citedModels : citedModels.slice(0, 1),
    sentiment: pr.cited ? "Positive" : "Neutral",
    leader: pr.cited ? "You" : workspace.competitors[0] ?? "Competitor",
    cited: pr.cited,
    fromAudit: true,
  };
}

export type ContentCalendarItem = {
  week: string;
  topic: string;
  format: string;
  rationale: string;
  pillar: EditorialPillarId;
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
      pillar: pillarForCalendarFormat("Pillar", "Closes your primary citation gap"),
    },
    {
      week: "Week 2",
      topic: `${workspace.domain} vs ${comp}`,
      format: "Comparison",
      rationale: "Captures alternative-intent prompts",
      pillar: pillarForCalendarFormat("Comparison", "Captures alternative-intent prompts"),
    },
    {
      week: "Week 3",
      topic: gap
        ? `Fix: ${gap.slice(0, 60)}${gap.length > 60 ? "…" : ""}`
        : "FAQ: pricing, implementation, and ROI",
      format: "FAQ",
      rationale: "Targets GEO schema and answer capsules",
      pillar: pillarForCalendarFormat("FAQ", "Targets GEO schema and answer capsules"),
    },
    {
      week: "Week 4",
      topic: `Case study — results with ${workspace.domain}`,
      format: "Proof",
      rationale: "Builds entity trust for AI citations",
      pillar: pillarForCalendarFormat("Proof", "Builds entity trust for AI citations"),
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
