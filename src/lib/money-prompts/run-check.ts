import { getWorkspaceById } from "@/lib/server/workspace";
import { analyzeCitationGap } from "@/lib/money-prompts/analyze-gap";
import {
  getMoneyPromptById,
  insertCitationGaps,
  insertMoneyPromptChecks,
  updateMoneyPromptStatus,
} from "@/lib/money-prompts/store";
import type { MoneyPromptBrand, MoneyPrompt } from "@/lib/money-prompts/types";

export function brandFromWorkspace(input: {
  id: string;
  userId: string;
  domain: string;
  name?: string | null;
  description?: string;
}): MoneyPromptBrand {
  return {
    id: input.id,
    userId: input.userId,
    name: input.name?.trim() || input.domain,
    domain: input.domain,
    description: input.description,
  };
}

export async function runMoneyPromptCheck(promptId: string): Promise<{
  prompt: MoneyPrompt;
  results: Awaited<ReturnType<typeof analyzeCitationGap>>;
  gapsOpened: number;
} | { error: string; status: number }> {
  const prompt = await getMoneyPromptById(promptId);
  if (!prompt) return { error: "Prompt not found", status: 404 };

  const workspace = await getWorkspaceById(prompt.workspaceId);
  if (!workspace) return { error: "Workspace not found", status: 404 };

  const brand = brandFromWorkspace({
    id: workspace.id,
    userId: prompt.userId,
    domain: workspace.domain,
    description: workspace.description,
  });

  const results = await analyzeCitationGap({
    brand,
    query: prompt.query || prompt.promptText,
  });

  if (results.length === 0) {
    return {
      error:
        "No citation engines configured. Set SERPER_API_KEY / SERPAPI_API_KEY, PERPLEXITY_API_KEY, and/or GEMINI_API_KEY.",
      status: 503,
    };
  }

  await insertMoneyPromptChecks(
    results.map((r) => ({
      promptId,
      engine: r.engine,
      brandCited: r.brandCited,
      competitorsCited: r.competitorsCited,
    })),
  );

  const gapRows = results
    .filter((r) => !r.brandCited && r.gapReason)
    .map((r) => ({
      workspaceId: prompt.workspaceId,
      userId: prompt.userId,
      moneyPromptId: promptId,
      query: prompt.query,
      engine: r.engine,
      brandCited: false,
      competitorsCited: r.competitorsCited,
      gapReason: r.gapReason,
      suggestedFix: r.suggestedFix || null,
      priority: r.priority,
      status: "open" as const,
    }));

  if (gapRows.length > 0) {
    await insertCitationGaps(gapRows);
  }

  const anyCited = results.some((r) => r.brandCited);
  const updated =
    (await updateMoneyPromptStatus(
      promptId,
      anyCited ? "cited" : "active",
    )) ?? prompt;

  return {
    prompt: updated,
    results,
    gapsOpened: gapRows.length,
  };
}
