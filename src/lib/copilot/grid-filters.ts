export type FilterLogic = "where" | "and" | "or";

export type FilterOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "larger_than"
  | "smaller_than"
  | "is_empty";

export type FilterColumnType = "string" | "number";

export type FilterColumnDef = {
  id: string;
  label: string;
  type: FilterColumnType;
};

export type GridFilterCondition = {
  id: string;
  logic: FilterLogic;
  columnId: string;
  operator: FilterOperator;
  value: string;
  /** UI-only: shown while Copilot is building this row */
  generating?: boolean;
};

export const FILTER_OPERATORS: { id: FilterOperator; label: string; types: FilterColumnType[] }[] = [
  { id: "equals", label: "Equals", types: ["string", "number"] },
  { id: "not_equals", label: "Does not equal", types: ["string", "number"] },
  { id: "contains", label: "Contains", types: ["string"] },
  { id: "not_contains", label: "Does not contain", types: ["string"] },
  { id: "larger_than", label: "Larger than", types: ["number"] },
  { id: "smaller_than", label: "Smaller than", types: ["number"] },
  { id: "is_empty", label: "Is empty", types: ["string", "number"] },
];

export const COMPETITOR_FILTER_COLUMNS: FilterColumnDef[] = [
  { id: "domain", label: "Domain", type: "string" },
  { id: "ndScore", label: "ND Score", type: "number" },
  { id: "cpc", label: "CPC", type: "number" },
  { id: "pageViews", label: "Page Views", type: "number" },
  { id: "h1", label: "H1", type: "string" },
  { id: "keywordTargeted", label: "Keyword Targeted", type: "string" },
  { id: "trend", label: "Trend", type: "number" },
];

export function createFilterId(): string {
  return `f_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function emptyFilter(logic: FilterLogic = "where"): GridFilterCondition {
  return {
    id: createFilterId(),
    logic,
    columnId: "ndScore",
    operator: "larger_than",
    value: "",
  };
}

export function isFilterPrompt(prompt: string): boolean {
  const p = prompt.toLowerCase();
  return (
    /\bfilter\b/.test(p) ||
    /\bsort\b/.test(p) ||
    /\bshow me\b/.test(p) ||
    /\bwhere\b/.test(p) ||
    /\bcontains\b/.test(p) ||
    /\blarger than\b/.test(p) ||
    /\bsmaller than\b/.test(p) ||
    /\bfewer\b.*\bpage views?\b/.test(p) ||
    /\branking higher\b/.test(p) ||
    /\bh1\b/.test(p) ||
    /\bnd score\b/.test(p) ||
    /\bcompetitor/.test(p) && /\b(table|list|grid)\b/.test(p)
  );
}

function colByAlias(text: string): string | null {
  const p = text.toLowerCase();
  if (/nd\s*score|domain rating|dr\b/.test(p)) return "ndScore";
  if (/\bcpc\b|cost per click/.test(p)) return "cpc";
  if (/page\s*views?|traffic|sessions/.test(p)) return "pageViews";
  if (/\bh1\b|headline|title tag/.test(p)) return "h1";
  if (/keyword|target/.test(p)) return "keywordTargeted";
  if (/domain|site|url|name/.test(p)) return "domain";
  if (/trend|change|delta/.test(p)) return "trend";
  return null;
}

function opFromText(text: string): FilterOperator {
  const p = text.toLowerCase();
  if (/not contain|doesn't contain|does not contain/.test(p)) return "not_contains";
  if (/contain|includes|has|using/.test(p)) return "contains";
  if (/not equal|is not|!=/.test(p)) return "not_equals";
  if (/equal|equals|is\b/.test(p)) return "equals";
  if (/fewer|less|smaller|below|under|<|lower/.test(p)) return "smaller_than";
  if (/larger|greater|more|above|over|>|higher/.test(p)) return "larger_than";
  if (/empty|blank|missing/.test(p)) return "is_empty";
  return "contains";
}

export function parseFilterPrompt(
  prompt: string,
  context?: { yourNdScore?: number; yourPageViews?: number },
): GridFilterCondition[] {
  const conditions: GridFilterCondition[] = [];
  const p = prompt.toLowerCase();

  const add = (
    columnId: string,
    operator: FilterOperator,
    value: string,
    logic: FilterLogic = conditions.length ? "and" : "where",
  ) => {
    conditions.push({
      id: createFilterId(),
      logic,
      columnId,
      operator,
      value,
    });
  };

  // Compound: ranking higher than my site but fewer page views
  if (/ranking higher|rank.*higher|outrank/.test(p) && /fewer|less/.test(p) && /page views?/.test(p)) {
    add("ndScore", "larger_than", String(context?.yourNdScore ?? 70));
    add("pageViews", "smaller_than", String(context?.yourPageViews ?? 5000));
    return conditions;
  }

  if (/ranking higher|rank.*higher|outrank/.test(p)) {
    add("ndScore", "larger_than", String(context?.yourNdScore ?? 70));
  }

  // ND Score patterns
  const ndMatch = p.match(/nd\s*score\s+(.+?)\s+(\d+)/i);
  if (ndMatch) {
    add("ndScore", opFromText(ndMatch[1]), ndMatch[2]);
  }

  // CPC patterns
  const cpcMatch = p.match(/cpc\s+(.+?)\s+([\d.]+)/i);
  if (cpcMatch) {
    add("cpc", opFromText(cpcMatch[1]), cpcMatch[2]);
  }

  // H1 contains
  const h1Match = p.match(/h1\s+(?:contains?|includes?|has)\s+["']?([^"'.]+)["']?/i);
  if (h1Match) {
    add("h1", "contains", h1Match[1].trim());
  }

  // keyword contains
  const kwMatch = p.match(/keyword\s+(?:contains?|includes?|has)\s+["']?([^"'.]+)["']?/i);
  if (kwMatch) {
    add("keywordTargeted", "contains", kwMatch[1].trim());
  }

  // page views
  const pvMatch = p.match(/page\s*views?\s+(.+?)\s+([\d,]+)/i);
  if (pvMatch) {
    add("pageViews", opFromText(pvMatch[1]), pvMatch[2].replace(/,/g, ""));
  }

  // domain/name patterns
  const nameMatch = p.match(/(?:name|domain)\s+is\s+not\s+["']?([^"'.]+)["']?/i);
  if (nameMatch) {
    add("domain", "not_contains", nameMatch[1].trim());
  }

  // sort by page load / trend descending
  if (/sort.*descending|descending.*sort/.test(p) && /load|speed|trend/.test(p)) {
    add("trend", "larger_than", "0", conditions.length ? "and" : "where");
  }

  // Generic "X larger than Y" for known columns
  for (const col of COMPETITOR_FILTER_COLUMNS) {
    const re = new RegExp(`${col.label.replace(/ /g, "\\s*")}\\s+(.+?)\\s+([\\d.]+)`, "i");
    const m = p.match(re);
    if (m && !conditions.some((c) => c.columnId === col.id)) {
      add(col.id, opFromText(m[1]), m[2]);
    }
  }

  // Fallback for filter table requests
  if (conditions.length === 0 && /\bfilter\b/.test(p)) {
    if (/marketing/.test(p)) add("h1", "contains", "marketing");
    else if (/90/.test(p)) add("ndScore", "larger_than", "90");
    else add("ndScore", "larger_than", "50");
  }

  return conditions;
}

export function columnLabel(columnId: string): string {
  return COMPETITOR_FILTER_COLUMNS.find((c) => c.id === columnId)?.label ?? columnId;
}

export function operatorLabel(op: FilterOperator): string {
  return FILTER_OPERATORS.find((o) => o.id === op)?.label ?? op;
}

export function filterChipLabel(condition: GridFilterCondition): string {
  const col = columnLabel(condition.columnId);
  const op = operatorLabel(condition.operator).toLowerCase();
  if (condition.operator === "is_empty") return `${col} is empty`;
  return `${col} ${op} ${condition.value}`;
}

type RowLike = Record<string, string | number | boolean | undefined>;

function compareValue(
  cell: string | number | boolean | undefined,
  operator: FilterOperator,
  value: string,
  type: FilterColumnType,
): boolean {
  if (operator === "is_empty") {
    return cell === undefined || cell === "" || cell === null;
  }

  const raw = String(cell ?? "");
  if (type === "number") {
    const num = typeof cell === "number" ? cell : parseFloat(raw.replace(/,/g, ""));
    const target = parseFloat(value);
    if (Number.isNaN(num) || Number.isNaN(target)) return false;
    switch (operator) {
      case "equals":
        return num === target;
      case "not_equals":
        return num !== target;
      case "larger_than":
        return num > target;
      case "smaller_than":
        return num < target;
      default:
        return false;
    }
  }

  const lower = raw.toLowerCase();
  const val = value.toLowerCase();
  switch (operator) {
    case "equals":
      return lower === val;
    case "not_equals":
      return lower !== val;
    case "contains":
      return lower.includes(val);
    case "not_contains":
      return !lower.includes(val);
    default:
      return false;
  }
}

export function applyGridFilters<T extends RowLike>(
  rows: T[],
  conditions: GridFilterCondition[],
  columns: FilterColumnDef[],
): T[] {
  const active = conditions.filter(
    (c) => c.operator === "is_empty" || c.value.trim() !== "",
  );
  if (!active.length) return rows;

  return rows.filter((row) => {
    let result: boolean | null = null;

    for (const cond of active) {
      const col = columns.find((c) => c.id === cond.columnId);
      if (!col) continue;
      const pass = compareValue(row[cond.columnId], cond.operator, cond.value, col.type);

      if (cond.logic === "where") {
        result = pass;
      } else if (cond.logic === "and") {
        result = (result ?? true) && pass;
      } else {
        result = (result ?? false) || pass;
      }
    }

    return result ?? true;
  });
}
