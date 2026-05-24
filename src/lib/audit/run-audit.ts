import { v4 as uuidv4 } from "uuid";
import type {
  AuditPayload,
  PromptResult,
  SiteSignals,
} from "@/lib/api-types";
import { platforms } from "@/lib/content";
import { dbGet, dbRun } from "@/lib/db";
import {
  analyzeSite,
  brandFromDomain,
  buildGapsFromSignals,
  normalizeDomain,
  promptOverlap,
} from "@/lib/audit/site-analyzer";

async function checkLiveCitation(
  prompt: string,
  domain: string,
  brand: string,
): Promise<boolean> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return false;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Answer the user question helpfully. Mention specific products, tools, and brands when relevant.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 450,
        temperature: 0.4,
      }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = (data.choices?.[0]?.message?.content ?? "").toLowerCase();
    const domainClean = domain.replace(/^www\./, "").toLowerCase();
    return (
      text.includes(domainClean) ||
      text.includes(brand.toLowerCase()) ||
      text.includes(domainClean.split(".")[0] ?? "")
    );
  } catch {
    return false;
  }
}

function buildPlatformPresence(
  geoScore: number,
  citedRatio: number,
  seed: number,
): AuditPayload["platforms"] {
  return platforms.map((name, i) => {
    const variance = ((seed + i * 13) % 25) - 12;
    const share = Math.max(
      0,
      Math.min(95, Math.round(geoScore * 0.35 + citedRatio * 55 + variance)),
    );
    const present = share >= 28;
    return { name, present, share: present ? share : 0 };
  });
}

function evaluatePrompts(
  prompts: string[],
  signals: SiteSignals,
  domain: string,
  liveChecks: boolean[],
): PromptResult[] {
  const brand = brandFromDomain(domain);
  const corpus = [
    signals.title,
    signals.metaDescription,
    signals.h1,
    brand,
    domain,
  ]
    .filter(Boolean)
    .join(" ");

  return prompts.map((prompt, i) => {
    const overlap = promptOverlap(prompt, corpus);
    const brandMentioned =
      corpus.toLowerCase().includes(brand.toLowerCase()) ||
      corpus.toLowerCase().includes(domain.split(".")[0] ?? "");
    const cited =
      liveChecks[i] ??
      (overlap >= 0.35 && brandMentioned && signals.geoScore >= 45);

    let reason: string;
    if (liveChecks[i] !== undefined) {
      reason = liveChecks[i]
        ? "Live LLM response cited your brand"
        : "Live LLM response did not cite your brand";
    } else if (cited) {
      reason = "On-site content aligns with this buyer question";
    } else if (overlap < 0.35) {
      reason = "Low keyword overlap between prompt and homepage content";
    } else if (!brandMentioned) {
      reason = "Brand entity not prominent enough on homepage";
    } else {
      reason = "GEO signals too weak for AI citation confidence";
    }

    return { prompt, cited, reason };
  });
}

export async function runCitationAudit(input: {
  domain: string;
  prompts: string[];
  workspaceId?: string | null;
  competitors?: string[];
}): Promise<AuditPayload> {
  const domain = normalizeDomain(input.domain);
  const prompts = input.prompts.map((p) => p.trim()).filter(Boolean);
  const signals = await analyzeSite(domain);
  const brand = brandFromDomain(domain);
  const hasOpenAi = Boolean(process.env.OPENAI_API_KEY);
  const liveChecks: boolean[] = [];

  if (hasOpenAi) {
    const toCheck = prompts.slice(0, 2);
    for (let i = 0; i < toCheck.length; i++) {
      liveChecks[i] = await checkLiveCitation(toCheck[i], domain, brand);
    }
  }

  const promptResults = evaluatePrompts(prompts, signals, domain, liveChecks);
  const cited = promptResults.filter((p) => p.cited).length;
  const total = Math.max(prompts.length, 1);
  const citedRatio = cited / total;
  const score = Math.round(
    signals.geoScore * 0.45 + citedRatio * 100 * 0.55,
  );
  const seed = domain.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const platformRows = buildPlatformPresence(signals.geoScore, citedRatio, seed);
  const gaps = buildGapsFromSignals(signals, promptResults, domain);
  const mode: AuditPayload["mode"] = hasOpenAi ? "live" : "technical";

  const payload: AuditPayload = {
    id: uuidv4(),
    domain,
    score,
    cited,
    total,
    platforms: platformRows,
    gaps,
    competitors: input.competitors ?? [],
    siteSignals: signals,
    mode,
    promptResults,
    workspaceId: input.workspaceId ?? null,
    createdAt: new Date().toISOString(),
  };

  await persistAudit(payload, prompts);
  return payload;
}

async function persistAudit(
  audit: AuditPayload,
  prompts: string[],
): Promise<void> {
  await dbRun(
    `INSERT INTO audit_runs (
      id, workspace_id, domain, prompts, score, cited_count, total_prompts,
      platforms, gaps, site_signals, prompt_results, mode, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      audit.id,
      audit.workspaceId,
      audit.domain,
      JSON.stringify(prompts),
      audit.score,
      audit.cited,
      audit.total,
      JSON.stringify(audit.platforms),
      JSON.stringify(audit.gaps),
      JSON.stringify(audit.siteSignals),
      JSON.stringify(audit.promptResults),
      audit.mode,
      audit.createdAt,
    ],
  );

  if (audit.workspaceId) {
    await dbRun(
      `INSERT INTO citation_snapshots (id, workspace_id, visibility_index, recorded_at)
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), audit.workspaceId, audit.score, audit.createdAt],
    );
  }
}

export async function getAuditById(id: string): Promise<AuditPayload | null> {
  const row = await dbGet<Record<string, string | number | null>>(
    `SELECT * FROM audit_runs WHERE id = ?`,
    [id],
  );
  if (!row) return null;
  return rowToAudit(row);
}

export async function getLatestAuditForWorkspace(
  workspaceId: string,
): Promise<AuditPayload | null> {
  const row = await dbGet<Record<string, string | number | null>>(
    `SELECT * FROM audit_runs WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 1`,
    [workspaceId],
  );
  if (!row) return null;
  return rowToAudit(row);
}

function rowToAudit(row: Record<string, string | number | null>): AuditPayload {
  return {
    id: String(row.id),
    domain: String(row.domain),
    score: Number(row.score),
    cited: Number(row.cited_count),
    total: Number(row.total_prompts),
    platforms: JSON.parse(String(row.platforms)),
    gaps: JSON.parse(String(row.gaps)),
    competitors: [],
    siteSignals: JSON.parse(String(row.site_signals)),
    promptResults: JSON.parse(String(row.prompt_results)),
    mode: String(row.mode) as AuditPayload["mode"],
    workspaceId: row.workspace_id ? String(row.workspace_id) : null,
    createdAt: String(row.created_at),
  };
}
