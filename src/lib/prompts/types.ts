export type PromptImportInput = {
  prompt_text: string;
  category?: string;
};

export type PromptExportRecord = {
  prompt_text: string;
  category: string;
  platform_chatgpt: string;
  platform_perplexity: string;
  platform_gemini: string;
  platform_grok: string;
  platform_deepseek: string;
  citation_rate: string;
  last_scanned: string;
  added_date: string;
};

export const PROMPT_EXPORT_COLUMNS: (keyof PromptExportRecord)[] = [
  "prompt_text",
  "category",
  "platform_chatgpt",
  "platform_perplexity",
  "platform_gemini",
  "platform_grok",
  "platform_deepseek",
  "citation_rate",
  "last_scanned",
  "added_date",
];

export type PromptValidationIssue = {
  row: number;
  prompt_text: string;
  reason: "too_short" | "too_long" | "duplicate" | "empty";
};

export type PromptImportPreviewRow = {
  rowIndex: number;
  prompt_text: string;
  category: string;
  valid: boolean;
  issue?: PromptValidationIssue["reason"];
};

export type PromptImportResult = {
  imported: number;
  skipped: number;
  errors: { prompt_text: string; reason: string }[];
};
