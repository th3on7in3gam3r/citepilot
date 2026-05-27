import { PLATFORMS } from "@/lib/dashboard";
import { brandFromDomain } from "@/lib/audit/site-analyzer";
import type { BillingPlan } from "@/lib/billing/types";
import type { SiteSignals } from "@/lib/api-types";

export type PlatformCheckMode = "live" | "inferred";

export type PlatformProbeResult = {
  platform: string;
  prompt: string;
  promptIndex: number;
  cited: boolean;
  checkMode: PlatformCheckMode;
};

export type PlatformPresenceRow = {
  name: string;
  present: boolean;
  share: number;
};

type LiveProvider = "openai" | "perplexity" | "serper";

const LIVE_PLATFORM_PROVIDERS: Record<string, LiveProvider | null> = {
  ChatGPT: "openai",
  Perplexity: "perplexity",
  "Google AI Overviews": "serper",
  Gemini: null,
  Copilot: null,
  Claude: null,
  Grok: null,
  DeepSeek: null,
};

function textMentionsBrand(text: string, domain: string, brand: string): boolean {
  const lower = text.toLowerCase();
  const domainClean = domain.replace(/^www\./, "").toLowerCase();
  const root = domainClean.split(".")[0] ?? "";
  return (
    lower.includes(domainClean) ||
    lower.includes(brand.toLowerCase()) ||
    (root.length > 2 && lower.includes(root))
  );
}

async function fetchOpenAiAnswer(prompt: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

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
        temperature: 0.35,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

async function fetchPerplexityAnswer(prompt: string): Promise<string | null> {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.PERPLEXITY_MODEL ?? "sonar",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 450,
        temperature: 0.2,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

async function fetchSerperContext(prompt: string): Promise<string | null> {
  const key = process.env.SERPER_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: prompt, num: 8 }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      answerBox?: { snippet?: string; title?: string };
      organic?: { title?: string; snippet?: string; link?: string }[];
    };
    const parts: string[] = [];
    if (data.answerBox?.snippet) parts.push(data.answerBox.snippet);
    if (data.answerBox?.title) parts.push(data.answerBox.title);
    for (const row of data.organic ?? []) {
      if (row.title) parts.push(row.title);
      if (row.snippet) parts.push(row.snippet);
      if (row.link) parts.push(row.link);
    }
    return parts.join("\n") || null;
  } catch {
    return null;
  }
}

async function fetchLiveAnswer(
  provider: LiveProvider,
  prompt: string,
): Promise<string | null> {
  if (provider === "openai") return fetchOpenAiAnswer(prompt);
  if (provider === "perplexity") return fetchPerplexityAnswer(prompt);
  return fetchSerperContext(prompt);
}

function probeBudget(plan: BillingPlan): {
  maxPrompts: number;
  livePlatforms: string[];
} {
  const configuredLive = PLATFORMS.filter((name) => {
    const provider = LIVE_PLATFORM_PROVIDERS[name];
    if (!provider) return false;
    if (provider === "openai") return Boolean(process.env.OPENAI_API_KEY);
    if (provider === "perplexity") return Boolean(process.env.PERPLEXITY_API_KEY);
    if (provider === "serper") return Boolean(process.env.SERPER_API_KEY);
    return false;
  });

  if (plan === "fleet") {
    return { maxPrompts: 12, livePlatforms: configuredLive };
  }
  if (plan === "pilot") {
    return { maxPrompts: 8, livePlatforms: configuredLive };
  }
  return {
    maxPrompts: configuredLive.length > 0 ? 3 : 0,
    livePlatforms: configuredLive.slice(0, 2),
  };
}

function inferPlatformPresence(
  platform: string,
  geoScore: number,
  liveCitationRate: number,
): PlatformPresenceRow {
  const nameHash = platform.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const modifier = (nameHash % 9) - 4;
  const share = Math.max(
    0,
    Math.min(
      95,
      Math.round(geoScore * 0.32 + liveCitationRate * 50 + modifier),
    ),
  );
  const present = share >= 28;
  return { name: platform, present, share: present ? share : 0 };
}

function aggregateLivePresence(
  checks: PlatformProbeResult[],
): Map<string, PlatformPresenceRow> {
  const map = new Map<string, { cited: number; total: number }>();
  for (const check of checks) {
    if (check.checkMode !== "live") continue;
    const row = map.get(check.platform) ?? { cited: 0, total: 0 };
    row.total += 1;
    if (check.cited) row.cited += 1;
    map.set(check.platform, row);
  }

  const out = new Map<string, PlatformPresenceRow>();
  for (const [platform, stats] of map) {
    const share =
      stats.total > 0 ? Math.round((stats.cited / stats.total) * 100) : 0;
    const present = stats.cited > 0;
    out.set(platform, {
      name: platform,
      present,
      share: present ? Math.max(share, 12) : 0,
    });
  }
  return out;
}

export async function runPlatformMonitoring(input: {
  domain: string;
  prompts: string[];
  plan: BillingPlan;
  siteSignals: SiteSignals;
}): Promise<{
  checks: PlatformProbeResult[];
  platforms: PlatformPresenceRow[];
}> {
  const domain = input.domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const brand = brandFromDomain(domain);
  const budget = probeBudget(input.plan);
  const promptsToProbe = input.prompts.slice(0, budget.maxPrompts);
  const checks: PlatformProbeResult[] = [];

  for (let promptIndex = 0; promptIndex < promptsToProbe.length; promptIndex++) {
    const prompt = promptsToProbe[promptIndex]!;
    for (const platform of budget.livePlatforms) {
      const provider = LIVE_PLATFORM_PROVIDERS[platform];
      if (!provider) continue;
      const answer = await fetchLiveAnswer(provider, prompt);
      if (answer === null) continue;
      checks.push({
        platform,
        prompt,
        promptIndex,
        cited: textMentionsBrand(answer, domain, brand),
        checkMode: "live",
      });
    }
  }

  const liveCitedPrompts = new Set(
    checks.filter((c) => c.cited).map((c) => c.promptIndex),
  );
  const liveCitationRate =
    promptsToProbe.length > 0
      ? liveCitedPrompts.size / promptsToProbe.length
      : 0;

  const livePresence = aggregateLivePresence(checks);
  const platforms: PlatformPresenceRow[] = PLATFORMS.map((name) => {
    const live = livePresence.get(name);
    if (live) return live;
    return inferPlatformPresence(name, input.siteSignals.geoScore, liveCitationRate);
  });

  return { checks, platforms };
}

export function liveChecksByPromptIndex(
  checks: PlatformProbeResult[],
  promptCount: number,
): boolean[] {
  const cited = new Set<number>();
  for (const check of checks) {
    if (check.cited) cited.add(check.promptIndex);
  }
  return Array.from({ length: promptCount }, (_, i) => cited.has(i));
}
