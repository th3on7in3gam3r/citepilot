import type { HeatmapRow } from "@/lib/citations/viz-data";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import { promptRowsForWorkspace } from "@/lib/dashboard-data";
import { buildKeywordRows } from "@/lib/site-details/keyword-data";
import type { PromptExportRecord } from "@/lib/prompts/types";

type PlatformKey =
  | "platform_chatgpt"
  | "platform_perplexity"
  | "platform_gemini"
  | "platform_grok"
  | "platform_deepseek";

const PLATFORM_MAP: { key: PlatformKey; platformId: string; presenceName: string }[] = [
  { key: "platform_chatgpt", platformId: "chatgpt", presenceName: "ChatGPT" },
  { key: "platform_perplexity", platformId: "perplexity", presenceName: "Perplexity" },
  { key: "platform_gemini", platformId: "gemini", presenceName: "Gemini" },
  { key: "platform_grok", platformId: "grok", presenceName: "Grok" },
  { key: "platform_deepseek", platformId: "deepseek", presenceName: "DeepSeek" },
];

function formatDate(iso: string | undefined | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function platformStatusFromHeatmap(
  row: HeatmapRow | undefined,
  platformId: string,
): string {
  if (!row) return "missing";
  const cell = row.cells.find((c) => c.platformId === platformId);
  if (!cell || cell.status === "no_data") return "missing";
  if (cell.status === "cited") return "cited";
  return "missing";
}

function platformStatusFromWorkspace(
  workspace: WorkspaceSnapshot,
  promptCited: boolean | undefined,
  presenceName: string,
): string {
  if (!workspace.hasRealAudit) return "missing";
  const present = workspace.platformPresence?.some(
    (p) => p.name === presenceName && p.present,
  );
  if (promptCited && present) return "cited";
  return "missing";
}

function citationRate(promptCited: boolean | undefined, heatmapRow?: HeatmapRow): string {
  if (heatmapRow) {
    return (heatmapRow.citationRate / 100).toFixed(2);
  }
  if (promptCited === true) return "1.00";
  if (promptCited === false) return "0.00";
  return "";
}

export function buildPromptExportRecords(
  workspace: WorkspaceSnapshot,
  heatmapRows?: HeatmapRow[],
): PromptExportRecord[] {
  const keywordRows = buildKeywordRows(workspace);
  const promptRows = promptRowsForWorkspace(workspace);
  const monitored = workspace.preferences?.monitoredPrompts ?? [];
  const lastScanned = formatDate(workspace.updatedAt);

  const promptMeta = new Map<string, { cited?: boolean; category: string }>();

  for (const kw of keywordRows) {
    const full = monitored.find((p) => p.startsWith(kw.keyword.replace("…", ""))) ?? kw.keyword;
    promptMeta.set(full, { cited: undefined, category: kw.category });
  }

  for (const pr of promptRows) {
    const existing = promptMeta.get(pr.prompt);
    promptMeta.set(pr.prompt, {
      cited: pr.cited,
      category: existing?.category ?? "Commercial",
    });
  }

  for (const text of monitored) {
    if (!promptMeta.has(text)) {
      promptMeta.set(text, { cited: undefined, category: "Commercial" });
    }
  }

  if (workspace.buyerQuestion?.trim() && !promptMeta.has(workspace.buyerQuestion.trim())) {
    promptMeta.set(workspace.buyerQuestion.trim(), {
      cited: promptRows.find((p) => p.prompt === workspace.buyerQuestion)?.cited,
      category: "Commercial",
    });
  }

  return Array.from(promptMeta.entries()).map(([prompt_text, meta]) => {
    const heatmapRow = heatmapRows?.find((r) => r.prompt === prompt_text);
    const record: PromptExportRecord = {
      prompt_text,
      category: meta.category,
      platform_chatgpt: "missing",
      platform_perplexity: "missing",
      platform_gemini: "missing",
      platform_grok: "missing",
      platform_deepseek: "missing",
      citation_rate: citationRate(meta.cited, heatmapRow),
      last_scanned: lastScanned,
      added_date: lastScanned,
    };

    for (const platform of PLATFORM_MAP) {
      record[platform.key] = heatmapRow
        ? platformStatusFromHeatmap(heatmapRow, platform.platformId)
        : platformStatusFromWorkspace(workspace, meta.cited, platform.presenceName);
    }

    return record;
  });
}

export type ProofReportRawRow = {
  prompt: string;
  platform: string;
  status: string;
  citation_rate: string;
  scanned_at: string;
  domain: string;
};

export function buildProofReportRawRows(
  workspace: WorkspaceSnapshot,
  heatmapRows: HeatmapRow[],
): ProofReportRawRow[] {
  const scannedAt = formatDate(workspace.updatedAt);
  const domain = workspace.domain;
  const rows: ProofReportRawRow[] = [];

  for (const heatmapRow of heatmapRows) {
    const rate = (heatmapRow.citationRate / 100).toFixed(2);
    for (const cell of heatmapRow.cells) {
      rows.push({
        prompt: heatmapRow.prompt,
        platform: cell.platformLabel,
        status: cell.status,
        citation_rate: rate,
        scanned_at: scannedAt,
        domain,
      });
    }
  }

  return rows;
}

export function proofReportRawToCsv(rows: ProofReportRawRow[]): string {
  const headers = ["prompt", "platform", "status", "citation_rate", "scanned_at", "domain"];
  const escape = (v: string) => {
    if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
    return v;
  };
  const body = rows.map((row) =>
    [row.prompt, row.platform, row.status, row.citation_rate, row.scanned_at, row.domain]
      .map(escape)
      .join(","),
  );
  return [headers.join(","), ...body].join("\n");
}
