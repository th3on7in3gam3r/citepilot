import {
  PROMPT_EXPORT_COLUMNS,
  type PromptExportRecord,
  type PromptImportInput,
} from "@/lib/prompts/types";

export function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

export function parseCsvTable(text: string): { headers: string[]; rows: string[][] } {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = splitCsvLine(lines[0]!).map((h) => h.toLowerCase().trim());
  const rows = lines.slice(1).map((line) => splitCsvLine(line));
  return { headers, rows };
}

const PROMPT_HEADER_ALIASES = [
  "prompt_text",
  "prompt",
  "keyword",
  "money_prompt",
  "query",
];

const CATEGORY_HEADER_ALIASES = ["category", "type", "segment"];

export function detectPromptColumn(headers: string[]): number {
  for (const alias of PROMPT_HEADER_ALIASES) {
    const idx = headers.indexOf(alias);
    if (idx >= 0) return idx;
  }
  return 0;
}

export function detectCategoryColumn(headers: string[]): number {
  for (const alias of CATEGORY_HEADER_ALIASES) {
    const idx = headers.indexOf(alias);
    if (idx >= 0) return idx;
  }
  return -1;
}

export function rowsToImportInputs(
  headers: string[],
  rows: string[][],
  promptCol: number,
  categoryCol: number,
): PromptImportInput[] {
  return rows
    .map((cells) => {
      const prompt_text = (cells[promptCol] ?? "").trim();
      const category =
        categoryCol >= 0 ? (cells[categoryCol] ?? "").trim() || undefined : undefined;
      return { prompt_text, category };
    })
    .filter((row) => row.prompt_text.length > 0);
}

export function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function recordsToCsv(records: PromptExportRecord[]): string {
  const header = PROMPT_EXPORT_COLUMNS.join(",");
  const body = records.map((record) =>
    PROMPT_EXPORT_COLUMNS.map((col) => escapeCsvCell(record[col])).join(","),
  );
  return [header, ...body].join("\n");
}

export const SAMPLE_CSV = `prompt_text,category,platform_chatgpt,platform_perplexity,platform_gemini,platform_grok,platform_deepseek,citation_rate,last_scanned,added_date
"best CRM for agencies","Commercial",cited,cited,missing,missing,missing,0.40,2026-06-14,2026-05-01
"alternatives to HubSpot","Commercial",cited,missing,missing,missing,missing,0.20,2026-06-14,2026-05-01`;

export function sampleCsvTemplate(): string {
  return SAMPLE_CSV;
}

/** Legacy one-column / prompt-header parser used by the import API. */
export function parsePromptCsv(text: string): string[] {
  const { headers, rows } = parseCsvTable(text);
  if (headers.length === 0) return [];

  const promptCol = detectPromptColumn(headers);
  const hasDataRows = rows.length > 0;
  if (!hasDataRows) {
    return headers[promptCol] ? [headers[promptCol]!].filter(Boolean) : [];
  }

  return [
    ...new Set(
      rowsToImportInputs(headers, rows, promptCol, -1).map((r) => r.prompt_text),
    ),
  ];
}
