import { getFixForGap } from "@/lib/geo/fixes";
import type {
  OptimizerCategory,
  OptimizerFix,
  OptimizerPlan,
} from "@/lib/optimizer/types";

const VALID_CATEGORIES = new Set<OptimizerCategory>([
  "seo",
  "aeo",
  "llm",
  "robots",
  "prompt",
]);

function categoryFromFixId(id: string, gap: string): OptimizerCategory {
  if (id === "robots") return "robots";
  if (id === "prompt-content" || gap.toLowerCase().includes("prompt")) return "prompt";
  if (id.includes("schema") || id === "answer-capsule" || id === "meta-description") {
    return "aeo";
  }
  if (id === "competitor-gap" || id === "custom-content") return "llm";
  return "seo";
}

function priorityForCategory(category: OptimizerCategory, index: number): number {
  const base: Record<OptimizerCategory, number> = {
    robots: 1,
    aeo: 1,
    prompt: 2,
    seo: 3,
    llm: 3,
  };
  return Math.min(5, base[category] + Math.floor(index / 3));
}

function baselineFixFromGap(gap: string, domain: string, index: number): OptimizerFix {
  const fix = getFixForGap(gap, domain);
  const category = categoryFromFixId(fix.id, gap);
  const deliverableType =
    fix.category === "content" || fix.category === "strategy" ? "prompt" : "code";

  const promptText = `You are optimizing ${domain} for AI citations and SEO.

## Issue
${gap}

## Goal
${fix.description}

## Implementation steps
${fix.instructions}

## Starting point
\`\`\`${fix.type === "json" ? "html" : fix.type}
${fix.code}
\`\`\`

Adapt this to the existing site structure. Provide exact files to edit and production-ready code.`;

  return {
    id: `baseline-${fix.id}-${index}`,
    category,
    priority: priorityForCategory(category, index),
    title: fix.title,
    problem: fix.description,
    deliverableType,
    code: deliverableType === "code" ? fix.code : undefined,
    prompt: deliverableType === "prompt" ? promptText : undefined,
    placement: fix.filename,
    relatedGap: gap,
    source: "baseline",
  };
}

export function buildBaselinePlan(input: {
  domain: string;
  gaps: string[];
  summary?: string;
}): OptimizerPlan {
  const gaps = input.gaps.length > 0 ? input.gaps : ["Run a GEO audit to detect citation gaps"];
  const fixes = gaps.slice(0, 12).map((gap, i) => baselineFixFromGap(gap, input.domain, i));

  return {
    summary:
      input.summary ??
      `Found ${fixes.length} optimization ${fixes.length === 1 ? "action" : "actions"} for ${input.domain} based on your latest audit gaps.`,
    fixes: fixes.sort((a, b) => a.priority - b.priority),
    aiGenerated: false,
    generatedAt: new Date().toISOString(),
  };
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenceMatch?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object in Claude response");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

function normalizeClaudeFix(raw: unknown, index: number): OptimizerFix | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const category = String(row.category ?? "seo").toLowerCase() as OptimizerCategory;
  if (!VALID_CATEGORIES.has(category)) return null;

  const deliverableType =
    row.deliverableType === "prompt" ? "prompt" : "code";
  const code = typeof row.code === "string" ? row.code.trim() : undefined;
  const prompt = typeof row.prompt === "string" ? row.prompt.trim() : undefined;

  if (deliverableType === "code" && !code) return null;
  if (deliverableType === "prompt" && !prompt) return null;

  const priorityRaw = Number(row.priority);
  const priority =
    Number.isFinite(priorityRaw) && priorityRaw >= 1 && priorityRaw <= 5
      ? priorityRaw
      : Math.min(5, index + 1);

  return {
    id: String(row.id ?? `claude-fix-${index}`),
    category,
    priority,
    title: String(row.title ?? "Optimization fix").slice(0, 120),
    problem: String(row.problem ?? "").slice(0, 600),
    deliverableType,
    code,
    prompt,
    placement: String(row.placement ?? "See instructions").slice(0, 200),
    relatedGap:
      typeof row.relatedGap === "string" ? row.relatedGap.slice(0, 200) : undefined,
    source: "ai",
  };
}

export function parseClaudeOptimizerPlan(
  text: string,
  fallback: OptimizerPlan,
): OptimizerPlan {
  try {
    const parsed = extractJsonObject(text) as {
      summary?: string;
      fixes?: unknown[];
    };
    const fixes = (parsed.fixes ?? [])
      .map((row, i) => normalizeClaudeFix(row, i))
      .filter((fix): fix is OptimizerFix => fix !== null)
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 12);

    if (fixes.length === 0) return fallback;

    return {
      summary: String(parsed.summary ?? fallback.summary).slice(0, 800),
      fixes,
      aiGenerated: true,
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return fallback;
  }
}

export function mergeOptimizerPlans(
  claudePlan: OptimizerPlan,
  baseline: OptimizerPlan,
): OptimizerPlan {
  if (!claudePlan.aiGenerated) return baseline;

  const seen = new Set(
    claudePlan.fixes.map((f) => (f.relatedGap ?? f.title).toLowerCase()),
  );
  const merged = [...claudePlan.fixes];

  for (const fix of baseline.fixes) {
    const key = (fix.relatedGap ?? fix.title).toLowerCase();
    if (!seen.has(key)) {
      merged.push(fix);
      seen.add(key);
    }
  }

  merged.sort((a, b) => a.priority - b.priority);

  return {
    ...claudePlan,
    fixes: merged.slice(0, 15),
  };
}
