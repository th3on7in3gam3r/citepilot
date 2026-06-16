import type { StoredPlatformCheck } from "@/lib/audit/platform-checks-store";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import {
  buildCompetitorBenchmark,
  promptRowsForWorkspace,
  type CompetitorBenchmarkResult,
} from "@/lib/dashboard-data";

export type HeatmapCellStatus = "cited" | "missing" | "partial" | "no_data";

export type HeatmapPlatform = {
  id: string;
  label: string;
  dbName: string;
};

export const HEATMAP_PLATFORMS: HeatmapPlatform[] = [
  { id: "chatgpt", label: "ChatGPT", dbName: "ChatGPT" },
  { id: "perplexity", label: "Perplexity", dbName: "Perplexity" },
  { id: "gemini", label: "Gemini", dbName: "Gemini" },
  { id: "google-ai", label: "Google AI", dbName: "Google AI Overviews" },
  { id: "grok", label: "Grok", dbName: "Grok" },
  { id: "deepseek", label: "DeepSeek", dbName: "DeepSeek" },
];

export type HeatmapCell = {
  platformId: string;
  platformLabel: string;
  status: HeatmapCellStatus;
  checkMode: "live" | "inferred" | null;
  detail: string;
};

export type HeatmapRow = {
  prompt: string;
  promptIndex: number;
  citationRate: number;
  cells: HeatmapCell[];
};

export type PlatformCitationRate = {
  platformId: string;
  label: string;
  citedCount: number;
  total: number;
  rate: number;
};

export type CitationHeatmapData = {
  rows: HeatmapRow[];
  platformRates: PlatformCitationRate[];
  hasAudit: boolean;
  auditId: string | null;
};

export type SovSegment = {
  domain: string;
  value: number;
  color: string;
};

export type SovPromptBar = {
  prompt: string;
  segments: SovSegment[];
  platformsCited: string[];
};

export type SovDomainCard = {
  domain: string;
  sovPercent: number;
  deltaPercent: number | null;
  history: number[];
  isYou: boolean;
};

export type CompetitorSovData = {
  available: boolean;
  cards: SovDomainCard[];
  bars: SovPromptBar[];
  benchmark: CompetitorBenchmarkResult;
};

const CELL_COLORS: Record<HeatmapCellStatus, string> = {
  cited: "#22c55e",
  missing: "#ef4444",
  partial: "#f59e0b",
  no_data: "#e5e7eb",
};

export function heatmapCellColor(status: HeatmapCellStatus): string {
  return CELL_COLORS[status];
}

function normalizeBrand(name: string): string {
  return name.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
}

function domainColor(domain: string): string {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = domain.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 62% 48%)`;
}

function resolveCellStatus(input: {
  check: StoredPlatformCheck | undefined;
  promptCited: boolean | null;
  platformPresent: boolean;
  hasAudit: boolean;
}): { status: HeatmapCellStatus; detail: string; checkMode: HeatmapCell["checkMode"] } {
  if (!input.hasAudit) {
    return {
      status: "no_data",
      detail: "Run a citation audit to populate this cell.",
      checkMode: null,
    };
  }

  if (input.check) {
    if (input.check.cited) {
      return {
        status: "cited",
        detail: `${input.check.platform} cited your brand for this prompt (${input.check.checkMode} check).`,
        checkMode: input.check.checkMode,
      };
    }
    if (input.check.checkMode === "inferred") {
      return {
        status: "partial",
        detail: `${input.check.platform} shows weak or inferred presence — not a confirmed citation.`,
        checkMode: "inferred",
      };
    }
    return {
      status: "missing",
      detail: `${input.check.platform} did not cite your brand on this prompt.`,
      checkMode: input.check.checkMode,
    };
  }

  if (input.promptCited === true && input.platformPresent) {
    return {
      status: "partial",
      detail: "Prompt is cited overall, but this platform was not probed directly.",
      checkMode: null,
    };
  }

  if (input.promptCited === false && input.platformPresent) {
    return {
      status: "missing",
      detail: "Platform is active for your category, but this prompt is not cited.",
      checkMode: null,
    };
  }

  return {
    status: "no_data",
    detail: "No probe data for this prompt × platform combination yet.",
    checkMode: null,
  };
}

export function buildCitationHeatmapData(input: {
  workspace: WorkspaceSnapshot;
  checks: StoredPlatformCheck[];
}): CitationHeatmapData {
  const { workspace, checks } = input;
  const auditId = workspace.auditId;
  const hasAudit = workspace.hasRealAudit && Boolean(auditId);
  const promptResults = workspace.promptResults ?? [];
  const platformPresence = workspace.platformPresence ?? [];

  const prompts =
    promptResults.length > 0
      ? promptResults.map((pr, index) => ({ prompt: pr.prompt, index, cited: pr.cited }))
      : workspace.buyerQuestion
        ? [{ prompt: workspace.buyerQuestion, index: 0, cited: null as boolean | null }]
        : [];

  const checkKey = (promptIndex: number, platform: string) =>
    `${promptIndex}:${platform}`;

  const checkMap = new Map<string, StoredPlatformCheck>();
  for (const check of checks) {
    checkMap.set(checkKey(check.promptIndex, check.platform), check);
  }

  const rows: HeatmapRow[] = prompts.map(({ prompt, index, cited }) => {
    const cells = HEATMAP_PLATFORMS.map((platform) => {
      const check = checkMap.get(checkKey(index, platform.dbName));
      const presence = platformPresence.find((p) => p.name === platform.dbName);
      const resolved = resolveCellStatus({
        check,
        promptCited: cited,
        platformPresent: presence?.present ?? false,
        hasAudit,
      });
      return {
        platformId: platform.id,
        platformLabel: platform.label,
        status: resolved.status,
        checkMode: resolved.checkMode,
        detail: resolved.detail,
      };
    });

    const measured = cells.filter((c) => c.status !== "no_data");
    const citedCount = cells.filter((c) => c.status === "cited").length;
    const citationRate =
      measured.length > 0 ? Math.round((citedCount / measured.length) * 100) : 0;

    return { prompt, promptIndex: index, citationRate, cells };
  });

  const platformRates: PlatformCitationRate[] = HEATMAP_PLATFORMS.map((platform) => {
    const cells = rows.map(
      (row) => row.cells.find((c) => c.platformId === platform.id)!,
    );
    const measured = cells.filter((c) => c.status !== "no_data");
    const citedCount = cells.filter((c) => c.status === "cited").length;
    const total = measured.length;
    return {
      platformId: platform.id,
      label: platform.label,
      citedCount,
      total,
      rate: total > 0 ? Math.round((citedCount / total) * 100) : 0,
    };
  });

  return { rows, platformRates, hasAudit, auditId };
}

function sovHistoryForDomain(
  workspace: WorkspaceSnapshot,
  basePercent: number,
  domain: string,
): number[] {
  const history = workspace.citationHistory ?? [];
  if (history.length >= 4) {
    return history.slice(-4).map((point) => point.visibilityIndex);
  }
  if (history.length > 0) {
    const values = history.map((point) => point.visibilityIndex);
    while (values.length < 4) {
      values.unshift(Math.max(0, values[0]! - 4));
    }
    return values.slice(-4);
  }

  const seed = domain.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return [0, 1, 2, 3].map((offset) =>
    Math.max(0, Math.min(100, basePercent - 6 + offset * 2 + (seed % 5))),
  );
}

export function buildCompetitorSovData(workspace: WorkspaceSnapshot): CompetitorSovData {
  const rows = promptRowsForWorkspace(workspace);
  const benchmark = buildCompetitorBenchmark(workspace, rows);
  const yourDomain = normalizeBrand(workspace.domain);
  const competitors = workspace.competitors.map(normalizeBrand).filter(Boolean).slice(0, 2);
  const domains = [yourDomain, ...competitors];
  const otherLabel = "Other / uncited";

  const bars: SovPromptBar[] = benchmark.prompts.map((promptRow) => {
    const segments: SovSegment[] = [];
    let remaining = 100;

    const youScore = promptRow.youCited ? 100 : promptRow.yourScore ?? 0;
    if (youScore > 0) {
      segments.push({ domain: yourDomain, value: youScore, color: domainColor(yourDomain) });
      remaining -= youScore;
    }

    const leader = promptRow.leader;
    if (!promptRow.youCited && leader && leader !== yourDomain && remaining > 0) {
      const leaderShare = Math.min(remaining, promptRow.gapToLeader ?? 55);
      segments.push({ domain: leader, value: leaderShare, color: domainColor(leader) });
      remaining -= leaderShare;
    }

    for (const competitor of competitors) {
      if (remaining <= 0) break;
      if (competitor === leader && !promptRow.youCited) continue;
      const share = Math.min(remaining, 12);
      if (share > 0 && !segments.some((s) => s.domain === competitor)) {
        segments.push({ domain: competitor, value: share, color: domainColor(competitor) });
        remaining -= share;
      }
    }

    if (remaining > 0) {
      segments.push({
        domain: otherLabel,
        value: remaining,
        color: "#cbd5e1",
      });
    }

    return {
      prompt: promptRow.prompt,
      segments,
      platformsCited: workspace.platformPresence
        ?.filter((p) => p.present)
        .map((p) => p.name) ?? [],
    };
  });

  const cards: SovDomainCard[] = domains.map((domain) => {
    const isYou = domain === yourDomain;
    const brandRow = benchmark.brands.find((b) => b.brand === domain);
    const sovPercent = isYou
      ? benchmark.prompts.length > 0
        ? Math.round(
            (benchmark.prompts.filter((p) => p.youCited).length /
              benchmark.prompts.length) *
              100,
          )
        : workspace.citationScore
      : brandRow?.avgVisibility ??
        Math.round(
          (benchmark.prompts.filter((p) => p.leader === domain).length /
            Math.max(benchmark.prompts.length, 1)) *
            100,
        );

    const history = sovHistoryForDomain(workspace, sovPercent, domain);
    const deltaPercent =
      history.length >= 2 ? history[history.length - 1]! - history[history.length - 2]! : null;

    return {
      domain,
      sovPercent,
      deltaPercent,
      history,
      isYou,
    };
  });

  return {
    available: benchmark.available,
    cards,
    bars,
    benchmark,
  };
}

export type HeatmapCellDetail = {
  prompt: string;
  platformLabel: string;
  status: HeatmapCellStatus;
  detail: string;
  checkMode: HeatmapCell["checkMode"];
};

export function cellDetailFromHeatmap(
  row: HeatmapRow,
  platformId: string,
): HeatmapCellDetail | null {
  const cell = row.cells.find((c) => c.platformId === platformId);
  if (!cell) return null;
  return {
    prompt: row.prompt,
    platformLabel: cell.platformLabel,
    status: cell.status,
    detail: cell.detail,
    checkMode: cell.checkMode,
  };
}
