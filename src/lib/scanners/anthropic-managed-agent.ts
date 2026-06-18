/**
 * REST client for Claude Managed Agents (public beta).
 * The installed @anthropic-ai/sdk may not yet expose beta.sessions — use fetch directly.
 */

const MANAGED_AGENTS_BETA = "managed-agents-2026-04-01";
const AGENT_STREAM_BETA = "agent-api-2026-03-01";
const ANTHROPIC_VERSION = "2023-06-01";
const SESSION_IDLE_TIMEOUT_MS = 90_000;

type AnthropicHeaders = Record<string, string>;

function anthropicHeaders(apiKey: string, beta: string): AnthropicHeaders {
  return {
    "x-api-key": apiKey,
    "anthropic-version": ANTHROPIC_VERSION,
    "anthropic-beta": beta,
    "content-type": "application/json",
  };
}

async function anthropicJson<T>(
  url: string,
  init: RequestInit & { apiKey: string; beta: string },
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...anthropicHeaders(init.apiKey, init.beta),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Anthropic API ${res.status}: ${body.slice(0, 400) || res.statusText}`,
    );
  }
  return (await res.json()) as T;
}

export function managedAgentConfigured(): boolean {
  return Boolean(
    process.env.ANTHROPIC_API_KEY?.trim() &&
      process.env.ANTHROPIC_AGENT_ID?.trim() &&
      process.env.BROWSER_USE_ENVIRONMENT_ID?.trim(),
  );
}

function parseSseEvents(buffer: string): {
  events: Array<{ type?: string; content?: unknown }>;
  rest: string;
} {
  const events: Array<{ type?: string; content?: unknown }> = [];
  const chunks = buffer.split("\n\n");
  const rest = chunks.pop() ?? "";

  for (const chunk of chunks) {
    const dataLine = chunk
      .split("\n")
      .find((line) => line.startsWith("data:"));
    if (!dataLine) continue;
    const payload = dataLine.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    try {
      events.push(JSON.parse(payload) as { type?: string; content?: unknown });
    } catch {
      /* ignore malformed SSE chunks */
    }
  }

  return { events, rest };
}

export async function runManagedAgentTask(input: {
  prompt: string;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  const agentId = process.env.ANTHROPIC_AGENT_ID?.trim();
  const environmentId = process.env.BROWSER_USE_ENVIRONMENT_ID?.trim();
  if (!apiKey || !agentId || !environmentId) {
    throw new Error("Anthropic managed agent is not configured");
  }

  const session = await anthropicJson<{ id: string }>(
    "https://api.anthropic.com/v1/sessions",
    {
      method: "POST",
      apiKey,
      beta: MANAGED_AGENTS_BETA,
      body: JSON.stringify({
        agent: agentId,
        environment_id: environmentId,
        title: "CitePilot citation scan",
      }),
    },
  );

  await anthropicJson<{ id?: string }>(
    `https://api.anthropic.com/v1/sessions/${session.id}/events`,
    {
      method: "POST",
      apiKey,
      beta: MANAGED_AGENTS_BETA,
      body: JSON.stringify({
        events: [
          {
            type: "user.message",
            content: [{ type: "text", text: input.prompt }],
          },
        ],
      }),
    },
  );

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SESSION_IDLE_TIMEOUT_MS);

  let sseBuffer = "";
  let responseText = "";

  try {
    const streamRes = await fetch(
      `https://api.anthropic.com/v1/sessions/${session.id}/stream`,
      {
        headers: anthropicHeaders(apiKey, AGENT_STREAM_BETA),
        signal: controller.signal,
      },
    );

    if (!streamRes.ok || !streamRes.body) {
      const body = await streamRes.text().catch(() => "");
      throw new Error(
        `Anthropic stream ${streamRes.status}: ${body.slice(0, 400) || streamRes.statusText}`,
      );
    }

    const reader = streamRes.body.getReader();
    const decoder = new TextDecoder();
    let idle = false;

    while (!idle) {
      const { done, value } = await reader.read();
      if (done) break;

      sseBuffer += decoder.decode(value, { stream: true });
      const parsed = parseSseEvents(sseBuffer);
      sseBuffer = parsed.rest;

      for (const event of parsed.events) {
        if (event.type === "agent.message") {
          const blocks = event.content as
            | Array<{ type?: string; text?: string }>
            | undefined;
          for (const block of blocks ?? []) {
            if (block.type === "text" && block.text) {
              responseText += block.text;
            }
          }
        }
        if (event.type === "session.status_idle") {
          idle = true;
        }
      }
    }
  } finally {
    clearTimeout(timeout);
  }

  return responseText.trim();
}
