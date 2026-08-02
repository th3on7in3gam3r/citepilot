import Anthropic from "@anthropic-ai/sdk";
import { completeCopilot } from "@/lib/copilot/complete";
import { captureServerException } from "@/lib/observability/sentry";

const ANTHROPIC_MODEL_FALLBACKS = [
  "claude-sonnet-4-20250514",
  "claude-3-5-sonnet-latest",
  "claude-3-5-sonnet-20241022",
  "claude-3-5-haiku-latest",
] as const;

function optimizerModels(): string[] {
  const preferred = process.env.ANTHROPIC_OPTIMIZER_MODEL?.trim();
  const models = preferred
    ? [preferred, ...ANTHROPIC_MODEL_FALLBACKS.filter((m) => m !== preferred)]
    : [...ANTHROPIC_MODEL_FALLBACKS];
  return [...new Set(models)];
}

async function completeWithAnthropic(
  system: string,
  userMessage: string,
  maxTokens: number,
): Promise<{ text: string } | { error: string }> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) {
    return { error: "Anthropic not configured" };
  }

  const client = new Anthropic({ apiKey: key });
  let lastError = "Anthropic request failed";

  for (const model of optimizerModels()) {
    try {
      const message = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: userMessage }],
      });

      const text = message.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n")
        .trim();

      if (text) return { text };
      lastError = "Empty model response";
    } catch (err) {
      captureServerException(err, { tags: { area: "site-optimizer", model } });
      lastError = err instanceof Error ? err.message : lastError;
      console.error(`[optimizer] Anthropic ${model}:`, lastError.slice(0, 300));
    }
  }

  return { error: lastError };
}

export async function completeOptimizer(
  system: string,
  userMessage: string,
  maxTokens = 4096,
): Promise<{ text: string } | { error: string }> {
  const anthropic = await completeWithAnthropic(system, userMessage, maxTokens);
  if (!("error" in anthropic)) return anthropic;

  const openai = await completeCopilot(system, userMessage, maxTokens);
  if (!("error" in openai)) return openai;

  console.error("[optimizer] Anthropic and OpenAI both failed", {
    anthropic: anthropic.error,
    openai: openai.error,
  });

  return {
    error:
      "AI enhancement unavailable — fixes from your audit are shown below.",
  };
}
