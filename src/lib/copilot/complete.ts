export async function completeCopilot(
  system: string,
  user: string,
  maxTokens = 700,
): Promise<{ text: string } | { error: string }> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    return { error: "OPENAI_API_KEY is not configured on the server." };
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
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: maxTokens,
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[copilot] OpenAI error", err.slice(0, 500));
    return { error: "Insight generation failed. Try again in a moment." };
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) {
    return { error: "Empty response from the model." };
  }

  return { text };
}
