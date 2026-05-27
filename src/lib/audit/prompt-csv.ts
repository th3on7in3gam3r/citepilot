/** Parse prompts from CSV (header "prompt" or single column). */
export function parsePromptCsv(text: string): string[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const first = splitCsvLine(lines[0]!);
  const header = first.map((c) => c.toLowerCase().trim());
  const promptCol = header.indexOf("prompt");
  const hasHeaderRow = promptCol >= 0 && lines.length > 1;
  const dataLines = hasHeaderRow ? lines.slice(1) : lines;

  const prompts: string[] = [];
  for (const line of dataLines) {
    const cells = splitCsvLine(line);
    const value =
      promptCol >= 0 ? (cells[promptCol] ?? "").trim() : (cells[0] ?? "").trim();
    if (value) prompts.push(value);
  }

  return [...new Set(prompts)];
}

function splitCsvLine(line: string): string[] {
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
