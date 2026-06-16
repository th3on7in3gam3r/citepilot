import type {
  PromptImportInput,
  PromptImportPreviewRow,
  PromptValidationIssue,
} from "@/lib/prompts/types";

const MIN_LENGTH = 10;
const MAX_LENGTH = 200;

export function validatePromptImports(
  inputs: PromptImportInput[],
  existingPrompts: string[],
): {
  preview: PromptImportPreviewRow[];
  valid: PromptImportInput[];
  issues: PromptValidationIssue[];
} {
  const existingLower = new Set(existingPrompts.map((p) => p.toLowerCase().trim()));
  const seenInBatch = new Set<string>();
  const preview: PromptImportPreviewRow[] = [];
  const valid: PromptImportInput[] = [];
  const issues: PromptValidationIssue[] = [];

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i]!;
    const text = input.prompt_text.trim();
    const rowIndex = i + 1;

    if (!text) {
      issues.push({ row: rowIndex, prompt_text: text, reason: "empty" });
      preview.push({
        rowIndex,
        prompt_text: text,
        category: input.category ?? "",
        valid: false,
        issue: "empty",
      });
      continue;
    }

    if (text.length < MIN_LENGTH) {
      issues.push({ row: rowIndex, prompt_text: text, reason: "too_short" });
      preview.push({
        rowIndex,
        prompt_text: text,
        category: input.category ?? "",
        valid: false,
        issue: "too_short",
      });
      continue;
    }

    if (text.length > MAX_LENGTH) {
      issues.push({ row: rowIndex, prompt_text: text, reason: "too_long" });
      preview.push({
        rowIndex,
        prompt_text: text,
        category: input.category ?? "",
        valid: false,
        issue: "too_long",
      });
      continue;
    }

    const key = text.toLowerCase();
    if (existingLower.has(key) || seenInBatch.has(key)) {
      issues.push({ row: rowIndex, prompt_text: text, reason: "duplicate" });
      preview.push({
        rowIndex,
        prompt_text: text,
        category: input.category ?? "",
        valid: false,
        issue: "duplicate",
      });
      continue;
    }

    seenInBatch.add(key);
    valid.push({ prompt_text: text, category: input.category });
    preview.push({
      rowIndex,
      prompt_text: text,
      category: input.category ?? "Commercial",
      valid: true,
    });
  }

  return { preview, valid, issues };
}

export function importSummaryMessage(
  validCount: number,
  skipped: number,
  errorCount: number,
): string {
  const parts = [`${validCount} valid prompt${validCount === 1 ? "" : "s"}`];
  if (skipped > 0) parts.push(`${skipped} duplicate${skipped === 1 ? "" : "s"} skipped`);
  if (errorCount > 0) parts.push(`${errorCount} error${errorCount === 1 ? "" : "s"}`);
  return parts.join(", ");
}
