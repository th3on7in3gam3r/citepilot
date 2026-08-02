import { randomUUID } from "crypto";
import { dbAll, dbGet, dbRun } from "@/lib/db";
import {
  DEFAULT_TARGET_ENGINES,
  type CitationGap,
  type CitationGapStatus,
  type CompetitorCitation,
  type GapReason,
  type MoneyPrompt,
  type MoneyPromptCheck,
  type MoneyPromptEngine,
  type MoneyPromptStatus,
  type PromptIntent,
} from "@/lib/money-prompts/types";

type MoneyPromptRow = {
  id: string;
  workspace_id: string;
  user_id: string;
  query: string;
  intent: string;
  prompt_text: string;
  target_engines: string;
  money_score: number;
  status: string;
  created_at: string;
  updated_at: string;
};

type MoneyPromptCheckRow = {
  id: string;
  prompt_id: string;
  engine: string;
  brand_cited: number;
  competitors_cited: string;
  raw_response: string | null;
  checked_at: string;
};

type CitationGapRow = {
  id: string;
  workspace_id: string;
  user_id: string;
  money_prompt_id: string | null;
  query: string;
  engine: string;
  brand_cited: number;
  competitors_cited: string;
  gap_reason: string | null;
  suggested_fix: string | null;
  priority: number;
  status: string;
  created_at: string;
};

function parseEngines(raw: string): MoneyPromptEngine[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...DEFAULT_TARGET_ENGINES];
    return parsed.filter((e): e is MoneyPromptEngine => typeof e === "string");
  } catch {
    return [...DEFAULT_TARGET_ENGINES];
  }
}

function parseCompetitors(raw: string): CompetitorCitation[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c): c is CompetitorCitation =>
        typeof c === "object" &&
        c !== null &&
        typeof (c as CompetitorCitation).name === "string" &&
        typeof (c as CompetitorCitation).url === "string",
    );
  } catch {
    return [];
  }
}

export function rowToMoneyPrompt(row: MoneyPromptRow): MoneyPrompt {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    query: row.query,
    intent: row.intent as PromptIntent,
    promptText: row.prompt_text,
    targetEngines: parseEngines(row.target_engines),
    moneyScore: Number(row.money_score) || 0,
    status: row.status as MoneyPromptStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToCheck(row: MoneyPromptCheckRow): MoneyPromptCheck {
  return {
    id: row.id,
    promptId: row.prompt_id,
    engine: row.engine as MoneyPromptEngine,
    brandCited: Boolean(row.brand_cited),
    competitorsCited: parseCompetitors(row.competitors_cited),
    rawResponse: row.raw_response,
    checkedAt: row.checked_at,
  };
}

export function rowToCitationGap(row: CitationGapRow): CitationGap {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    moneyPromptId: row.money_prompt_id,
    query: row.query,
    engine: row.engine as MoneyPromptEngine,
    brandCited: Boolean(row.brand_cited),
    competitorsCited: parseCompetitors(row.competitors_cited),
    gapReason: (row.gap_reason as GapReason | null) ?? null,
    suggestedFix: row.suggested_fix,
    priority: Math.min(5, Math.max(1, Number(row.priority) || 3)) as
      | 1
      | 2
      | 3
      | 4
      | 5,
    status: row.status as CitationGapStatus,
    createdAt: row.created_at,
  };
}

export async function listMoneyPrompts(
  workspaceId: string,
): Promise<MoneyPrompt[]> {
  const rows = await dbAll<MoneyPromptRow>(
    `SELECT * FROM money_prompts WHERE workspace_id = ? ORDER BY money_score DESC, created_at DESC`,
    [workspaceId],
  );
  return rows.map(rowToMoneyPrompt);
}

export async function getMoneyPromptById(
  id: string,
): Promise<MoneyPrompt | null> {
  const row = await dbGet<MoneyPromptRow>(
    `SELECT * FROM money_prompts WHERE id = ?`,
    [id],
  );
  return row ? rowToMoneyPrompt(row) : null;
}

export async function insertMoneyPrompts(
  rows: Array<{
    workspaceId: string;
    userId: string;
    query: string;
    intent: PromptIntent;
    promptText: string;
    targetEngines?: MoneyPromptEngine[];
    moneyScore: number;
    status?: MoneyPromptStatus;
  }>,
): Promise<MoneyPrompt[]> {
  const now = new Date().toISOString();
  const inserted: MoneyPrompt[] = [];

  for (const row of rows) {
    const id = randomUUID();
    const engines = JSON.stringify(row.targetEngines ?? DEFAULT_TARGET_ENGINES);
    const status = row.status ?? "draft";
    await dbRun(
      `INSERT INTO money_prompts (
        id, workspace_id, user_id, query, intent, prompt_text,
        target_engines, money_score, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        row.workspaceId,
        row.userId,
        row.query,
        row.intent,
        row.promptText,
        engines,
        Math.min(100, Math.max(0, Math.round(row.moneyScore))),
        status,
        now,
        now,
      ],
    );
    inserted.push({
      id,
      workspaceId: row.workspaceId,
      userId: row.userId,
      query: row.query,
      intent: row.intent,
      promptText: row.promptText,
      targetEngines: row.targetEngines ?? [...DEFAULT_TARGET_ENGINES],
      moneyScore: Math.min(100, Math.max(0, Math.round(row.moneyScore))),
      status,
      createdAt: now,
      updatedAt: now,
    });
  }

  return inserted;
}

export async function updateMoneyPromptStatus(
  id: string,
  status: MoneyPromptStatus,
): Promise<MoneyPrompt | null> {
  const now = new Date().toISOString();
  await dbRun(
    `UPDATE money_prompts SET status = ?, updated_at = ? WHERE id = ?`,
    [status, now, id],
  );
  return getMoneyPromptById(id);
}

export async function listActiveMoneyPrompts(
  limit = 50,
): Promise<MoneyPrompt[]> {
  const rows = await dbAll<MoneyPromptRow>(
    `SELECT * FROM money_prompts WHERE status = 'active' ORDER BY updated_at ASC LIMIT ?`,
    [limit],
  );
  return rows.map(rowToMoneyPrompt);
}

export async function insertMoneyPromptChecks(
  checks: Array<{
    promptId: string;
    engine: MoneyPromptEngine;
    brandCited: boolean;
    competitorsCited: CompetitorCitation[];
    rawResponse?: string | null;
  }>,
): Promise<MoneyPromptCheck[]> {
  const now = new Date().toISOString();
  const out: MoneyPromptCheck[] = [];
  for (const check of checks) {
    const id = randomUUID();
    await dbRun(
      `INSERT INTO money_prompt_checks (
        id, prompt_id, engine, brand_cited, competitors_cited, raw_response, checked_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        check.promptId,
        check.engine,
        check.brandCited ? 1 : 0,
        JSON.stringify(check.competitorsCited),
        check.rawResponse ?? null,
        now,
      ],
    );
    out.push({
      id,
      promptId: check.promptId,
      engine: check.engine,
      brandCited: check.brandCited,
      competitorsCited: check.competitorsCited,
      rawResponse: check.rawResponse ?? null,
      checkedAt: now,
    });
  }
  return out;
}

export async function listCitationGaps(
  workspaceId: string,
  status: CitationGapStatus = "open",
): Promise<CitationGap[]> {
  const rows = await dbAll<CitationGapRow>(
    `SELECT * FROM citation_gaps
     WHERE workspace_id = ? AND status = ?
     ORDER BY priority ASC, created_at DESC`,
    [workspaceId, status],
  );
  return rows.map(rowToCitationGap);
}

export async function insertCitationGaps(
  gaps: Array<{
    workspaceId: string;
    userId: string;
    moneyPromptId?: string | null;
    query: string;
    engine: MoneyPromptEngine;
    brandCited?: boolean;
    competitorsCited: CompetitorCitation[];
    gapReason: GapReason | null;
    suggestedFix: string | null;
    priority: 1 | 2 | 3 | 4 | 5;
    status?: CitationGapStatus;
  }>,
): Promise<CitationGap[]> {
  const now = new Date().toISOString();
  const out: CitationGap[] = [];
  for (const gap of gaps) {
    const id = randomUUID();
    const status = gap.status ?? "open";
    await dbRun(
      `INSERT INTO citation_gaps (
        id, workspace_id, user_id, money_prompt_id, query, engine,
        brand_cited, competitors_cited, gap_reason, suggested_fix,
        priority, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        gap.workspaceId,
        gap.userId,
        gap.moneyPromptId ?? null,
        gap.query,
        gap.engine,
        gap.brandCited ? 1 : 0,
        JSON.stringify(gap.competitorsCited),
        gap.gapReason,
        gap.suggestedFix,
        gap.priority,
        status,
        now,
      ],
    );
    out.push({
      id,
      workspaceId: gap.workspaceId,
      userId: gap.userId,
      moneyPromptId: gap.moneyPromptId ?? null,
      query: gap.query,
      engine: gap.engine,
      brandCited: Boolean(gap.brandCited),
      competitorsCited: gap.competitorsCited,
      gapReason: gap.gapReason,
      suggestedFix: gap.suggestedFix,
      priority: gap.priority,
      status,
      createdAt: now,
    });
  }
  return out;
}

export async function getCitationGapById(
  id: string,
): Promise<CitationGap | null> {
  const row = await dbGet<CitationGapRow>(
    `SELECT * FROM citation_gaps WHERE id = ?`,
    [id],
  );
  return row ? rowToCitationGap(row) : null;
}

export async function updateCitationGapStatus(
  id: string,
  status: CitationGapStatus,
): Promise<CitationGap | null> {
  await dbRun(`UPDATE citation_gaps SET status = ? WHERE id = ?`, [
    status,
    id,
  ]);
  return getCitationGapById(id);
}
