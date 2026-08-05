import { buildAssistantSystemPrompt } from "@/lib/assistant/system-prompt";
import type { FaqItem } from "@/lib/marketing/site-faq";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export async function completeAssistantChat(
  knowledge: FaqItem[],
  messages: ChatTurn[],
  maxTokens = 500,
): Promise<{ text: string } | { error: string }> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    return { error: "not_configured" };
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [
        { role: "system", content: buildAssistantSystemPrompt(knowledge) },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[assistant] OpenAI error", err.slice(0, 500));
    return { error: "generation_failed" };
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) {
    return { error: "empty" };
  }

  return { text };
}
