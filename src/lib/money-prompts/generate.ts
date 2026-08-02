import { z } from "zod";
import { completeOptimizer } from "@/lib/optimizer/complete";
import { completeCopilot } from "@/lib/copilot/complete";
import {
  DEFAULT_TARGET_ENGINES,
  PROMPT_INTENTS,
  type MoneyPromptBrand,
  type PromptIntent,
} from "@/lib/money-prompts/types";

const SYSTEM_PROMPT = `You are a GEO (Generative Engine Optimization) strategist. Your job is to write
"money prompts": the exact, realistic sentences a paying customer would type into ChatGPT, Perplexity,
Gemini, or a Google AI Overview when they are close to a purchase decision. These are NOT SEO keywords —
they are natural-language prompts a real buyer types, phrased the way people actually talk to AI assistants.

Rules:
- Every prompt must reflect genuine commercial intent (comparison, "best of", near-me, review, or how-to-buy).
- Prompts must be specific enough that a cited answer would name real brands/products, not generic advice.
- Never mention the target brand by name inside the prompt itself — the prompt is what a customer with
  no brand loyalty yet would type, and the point is to check whether the brand instead gets surfaced in the answer.
- Return strict JSON only, no prose, no markdown fences.`;

export type GeneratePromptsInput = {
  brand: MoneyPromptBrand;
  seedQueries: string[];
  countPerQuery?: number;
};

export type GeneratedPrompt = {
  query: string;
  intent: PromptIntent;
  promptText: string;
  moneyScore: number;
};

const generatedSchema = z.object({
  prompts: z.array(
    z.object({
      query: z.string().min(1),
      intent: z.string(),
      prompt_text: z.string().min(1).optional(),
      promptText: z.string().min(1).optional(),
      money_score: z.number().optional(),
      moneyScore: z.number().optional(),
    }),
  ),
});

function buildUserMessage(input: GeneratePromptsInput): string {
  const { brand, seedQueries, countPerQuery = 4 } = input;
  return JSON.stringify({
    brand: {
      name: brand.name,
      domain: brand.domain,
      description: brand.description ?? "",
    },
    seed_queries: seedQueries,
    prompts_per_query: countPerQuery,
    intents: PROMPT_INTENTS,
    output_schema: {
      prompts: [
        {
          query: "string - the seed query this was derived from",
          intent: "one of the six intents above",
          prompt_text: "string - the literal prompt a buyer would type",
          money_score: "integer 0-100, higher = closer to purchase decision",
        },
      ],
    },
  });
}

export function clampMoneyScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.min(100, Math.max(0, Math.round(score)));
}

export function normalizeIntent(raw: string): PromptIntent {
  const cleaned = raw.trim().toLowerCase().replace(/_/g, "-");
  if ((PROMPT_INTENTS as string[]).includes(cleaned)) {
    return cleaned as PromptIntent;
  }
  if (cleaned.includes("compar")) return "comparison";
  if (cleaned.includes("best")) return "best-of";
  if (cleaned.includes("near")) return "near-me";
  if (cleaned.includes("review")) return "review";
  if (cleaned.includes("buy") || cleaned.includes("how")) return "how-to-buy";
  return "transactional";
}

export function parseGeneratedPromptsJson(text: string): GeneratedPrompt[] {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const parsed = generatedSchema.parse(JSON.parse(cleaned));
  return parsed.prompts
    .map((p) => {
      const promptText = (p.prompt_text ?? p.promptText ?? "").trim();
      if (!promptText) return null;
      return {
        query: p.query.trim(),
        intent: normalizeIntent(p.intent),
        promptText,
        moneyScore: clampMoneyScore(p.money_score ?? p.moneyScore ?? 50),
      };
    })
    .filter((p): p is GeneratedPrompt => p !== null);
}

/**
 * Generates money prompts for a workspace brand context.
 * Anthropic via optimizer complete first; OpenAI fallback.
 */
export async function generateMoneyPrompts(
  input: GeneratePromptsInput,
): Promise<GeneratedPrompt[]> {
  if (!input.seedQueries.length) {
    throw new Error("seedQueries required");
  }

  const userMessage = buildUserMessage(input);
  const primary = await completeOptimizer(SYSTEM_PROMPT, userMessage, 2000);
  if (!("error" in primary)) {
    try {
      return parseGeneratedPromptsJson(primary.text);
    } catch {
      // fall through to OpenAI
    }
  }

  const fallback = await completeCopilot(SYSTEM_PROMPT, userMessage, 2000);
  if ("error" in fallback) {
    const primaryMsg = "error" in primary ? primary.error : "Generation failed";
    throw new Error(fallback.error || primaryMsg);
  }
  return parseGeneratedPromptsJson(fallback.text);
}

export function toMoneyPromptInsertRows(
  brand: MoneyPromptBrand,
  userId: string,
  generated: GeneratedPrompt[],
) {
  return generated.map((g) => ({
    workspaceId: brand.id,
    userId,
    query: g.query,
    intent: g.intent,
    promptText: g.promptText,
    targetEngines: [...DEFAULT_TARGET_ENGINES],
    moneyScore: g.moneyScore,
    status: "draft" as const,
  }));
}
