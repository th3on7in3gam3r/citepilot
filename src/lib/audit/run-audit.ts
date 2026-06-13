import { v4 as uuidv4 } from "uuid";
import type {
  AuditPayload,
  PromptResult,
  SiteSignals,
} from "@/lib/api-types";
import type { BillingPlan } from "@/lib/billing/types";
import { persistPlatformChecks } from "@/lib/audit/platform-checks-store";
import type { PlatformProbeResult } from "@/lib/audit/platform-probes";
import {
  buildPlatformPresence,
  liveChecksByPromptIndex,
  runLivePlatformProbes,
} from "@/lib/audit/platform-probes";
import { dbAll, dbGet, dbRun } from "@/lib/db";
import {
  analyzeSite,
  brandFromDomain,
  buildGapsFromSignals,
  computeGeoScore,
  normalizeDomain,
  promptOverlap,
} from "@/lib/audit/site-analyzer";
import { regenerateContentStrategyForAudit } from "@/lib/content-strategy/regenerate";
import {
  parseGaps,
  parsePlatforms,
  parsePromptResults,
  parseSiteSignals,
} from "@/lib/audit/safe-payload";

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
        ? "Cited on at least one live AI surface check"
        : "Not cited on live AI surface checks for this prompt";
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
  plan?: BillingPlan;
  trigger?: "manual" | "scheduled";
}): Promise<AuditPayload> {
  const domain = normalizeDomain(input.domain);
  const prompts = input.prompts.map((p) => p.trim()).filter(Boolean);
  const plan = input.plan ?? "free";

  const [signals, checks] = await Promise.all([
    analyzeSite(domain),
    runLivePlatformProbes({ domain, prompts, plan }),
  ]);

  // Apply auto-fix overrides if workspaceId is present
  let appliedFixes: string[] = [];
  if (input.workspaceId) {
    const row = await dbGet<{ preferences: string }>(
      `SELECT preferences FROM workspaces WHERE id = ?`,
      [input.workspaceId],
    );
    if (row?.preferences) {
      try {
        const parsed = JSON.parse(row.preferences);
        if (Array.isArray(parsed.appliedFixes)) {
          appliedFixes = parsed.appliedFixes;
        }
      } catch {}
    }
  }

  if (appliedFixes.length > 0) {
    if (appliedFixes.includes("faq-schema")) {
      signals.hasFaqSchema = true;
      signals.hasJsonLd = true;
    }
    if (appliedFixes.includes("org-schema")) {
      signals.hasOrganizationSchema = true;
      signals.hasJsonLd = true;
    }
    if (appliedFixes.includes("meta-description")) {
      signals.metaDescription = signals.metaDescription || "AI-optimized meta description applied dynamically via CitePilot Auto-Fix.";
    }
    if (appliedFixes.includes("h1")) {
      signals.h1 = signals.h1 || "AI-optimized H1 heading applied dynamically via CitePilot Auto-Fix.";
    }
    if (appliedFixes.includes("robots")) {
      signals.robotsAllows = true;
    }
    if (appliedFixes.includes("sitemap")) {
      signals.sitemapFound = true;
    }
    if (appliedFixes.includes("content")) {
      if (signals.wordCount < 300) {
        signals.wordCount = 350;
      }
    }
    // Recompute the geo score based on overridden signals
    signals.geoScore = computeGeoScore(signals);
  }

  const platforms = buildPlatformPresence(checks, signals, prompts.length);
  const liveChecks = liveChecksByPromptIndex(checks, prompts.length);
  const promptResults = evaluatePrompts(prompts, signals, domain, liveChecks);
  const cited = promptResults.filter((p) => p.cited).length;
  const total = Math.max(prompts.length, 1);
  const citedRatio = cited / total;
  const score = Math.round(
    signals.geoScore * 0.45 + citedRatio * 100 * 0.55,
  );

  const hasLiveChecks = checks.some((c) => c.checkMode === "live");
  const gaps = buildGapsFromSignals(signals, promptResults, domain);
  const mode: AuditPayload["mode"] = hasLiveChecks ? "live" : "technical";

  const payload: AuditPayload = {
    id: uuidv4(),
    domain,
    score,
    cited,
    total,
    platforms,
    gaps,
    competitors: input.competitors ?? [],
    siteSignals: signals,
    mode,
    promptResults,
    workspaceId: input.workspaceId ?? null,
    createdAt: new Date().toISOString(),
  };

  await persistAudit(payload, prompts, checks, input.trigger ?? "manual");
  return payload;
}

async function persistAudit(
  audit: AuditPayload,
  prompts: string[],
  platformChecks: PlatformProbeResult[],
  trigger: "manual" | "scheduled",
): Promise<void> {
  await dbRun(
    `INSERT INTO audit_runs (
      id, workspace_id, domain, prompts, score, cited_count, total_prompts,
      platforms, gaps, site_signals, prompt_results, mode, trigger, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      trigger,
      audit.createdAt,
    ],
  );

  await persistPlatformChecks(
    audit.id,
    audit.workspaceId,
    platformChecks,
    audit.createdAt,
  );

  if (audit.workspaceId) {
    await dbRun(
      `INSERT INTO citation_snapshots (id, workspace_id, visibility_index, recorded_at)
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), audit.workspaceId, audit.score, audit.createdAt],
    );
    await regenerateContentStrategyForAudit(audit.workspaceId, audit);
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

export async function getRecentAuditsForWorkspace(
  workspaceId: string,
  limit = 2,
): Promise<AuditPayload[]> {
  const rows = await dbAll<Record<string, string | number | null>>(
    `SELECT * FROM audit_runs WHERE workspace_id = ? ORDER BY created_at DESC LIMIT ?`,
    [workspaceId, limit],
  );
  return rows.map(rowToAudit);
}

export async function getPreviousAuditScore(
  workspaceId: string,
  currentAuditId: string,
): Promise<number | null> {
  const rows = await dbAll<{ id: string; score: number }>(
    `SELECT id, score FROM audit_runs WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 2`,
    [workspaceId],
  );
  if (rows.length < 2) return null;
  const previous = rows.find((r) => r.id !== currentAuditId) ?? rows[1];
  return previous ? Number(previous.score) : null;
}

function rowToAudit(row: Record<string, string | number | null>): AuditPayload {
  const score = Number(row.score);
  let siteSignalsRaw: unknown = null;
  if (row.site_signals != null && row.site_signals !== "") {
    try {
      siteSignalsRaw = JSON.parse(String(row.site_signals));
    } catch {
      siteSignalsRaw = null;
    }
  }

  return {
    id: String(row.id),
    domain: String(row.domain),
    score,
    cited: Number(row.cited_count),
    total: Number(row.total_prompts),
    platforms: parsePlatforms(row.platforms),
    gaps: parseGaps(row.gaps),
    competitors: [],
    siteSignals: parseSiteSignals(siteSignalsRaw, score),
    promptResults: parsePromptResults(row.prompt_results),
    mode: String(row.mode) as AuditPayload["mode"],
    workspaceId: row.workspace_id ? String(row.workspace_id) : null,
    createdAt: String(row.created_at),
  };
}
