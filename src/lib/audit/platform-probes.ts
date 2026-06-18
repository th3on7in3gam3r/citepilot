import { PLATFORMS } from "@/lib/dashboard";
import { brandFromDomain } from "@/lib/audit/site-analyzer";
import type { BillingPlan } from "@/lib/billing/types";
import type { SiteSignals } from "@/lib/api-types";
import {
  browserScannerConfigured,
  delayBetweenBrowserScans,
  isScanUnavailableNotes,
  scanWithBrowser,
} from "@/lib/scanners/browser-scanner";
import {
  BROWSER_PLATFORM_ID_BY_NAME,
  type BrowserScanPlatformName,
} from "@/lib/scanners/platform-config";
import {
  googleSearchConfigured,
  googleSearchContextText,
  searchGoogle,
  type GoogleSearchRunContext,
} from "@/lib/search/google";

export type PlatformCheckMode = "live" | "inferred";

export type PlatformProbeResult = {
  platform: string;
  prompt: string;
  promptIndex: number;
  cited: boolean;
  checkMode: PlatformCheckMode;
  notes?: string | null;
  scanUnavailable?: boolean;
};

export type PlatformPresenceRow = {
  name: string;
  present: boolean;
  share: number;
};

type LiveProvider = "openai" | "perplexity" | "google";

const LIVE_PLATFORM_PROVIDERS: Record<string, LiveProvider | null> = {
  ChatGPT: "openai",
  Perplexity: "perplexity",
  "Google AI Overviews": "google",
  Gemini: null,
  Copilot: null,
  Claude: null,
  Grok: null,
  DeepSeek: null,
};

/** Per external LLM/search call — keeps audits inside Vercel time limits. */
const PROBE_TIMEOUT_MS = 8_000;
/** Hard stop for all live probes in one audit (parallel with site fetch). */
const LIVE_PROBE_WALL_MS = 20_000;
/** Wall time for browser-based probes (Grok, Google AI Overviews UI). */
const BROWSER_PROBE_WALL_MS = 110_000;
/** Max concurrent live probes (OpenAI + Perplexity + Serper). */
const PROBE_CONCURRENCY = 5;

const BROWSER_PLATFORMS: BrowserScanPlatformName[] = [
  "Grok",
  "Google AI Overviews",
];

const MAX_BROWSER_SCANS_PER_AUDIT: Record<BillingPlan, number> = {
  free: 0,
  pilot: 4,
  fleet: 8,
};

/** Cap total live API calls so audits finish before gateway timeouts. */
const MAX_LIVE_PROBE_CALLS: Record<BillingPlan, number> = {
  free: 6,
  pilot: 15,
  fleet: 30,
};

type ProbeTask = {
  promptIndex: number;
  prompt: string;
  platform: string;
  provider: LiveProvider;
};

type BrowserProbeTask = {
  promptIndex: number;
  prompt: string;
  platform: BrowserScanPlatformName;
};

function shouldUseBrowserForGoogle(plan: BillingPlan): boolean {
  return plan !== "free" && browserScannerConfigured();
}

function browserPlatformsForPlan(plan: BillingPlan): BrowserScanPlatformName[] {
  if (plan === "free" || !browserScannerConfigured()) return [];
  return BROWSER_PLATFORMS;
}

function browserResultToProbe(
  result: Awaited<ReturnType<typeof scanWithBrowser>>,
  platform: BrowserScanPlatformName,
  promptIndex: number,
): PlatformProbeResult {
  const scanUnavailable = isScanUnavailableNotes(result.notes);
  return {
    platform,
    prompt: result.prompt,
    promptIndex,
    cited: scanUnavailable ? false : result.cited,
    checkMode: "live",
    notes: result.notes,
    scanUnavailable,
  };
}

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

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
): Promise<Response | null> {
  try {
    return await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
  } catch {
    return null;
  }
}

async function fetchOpenAiAnswer(prompt: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const res = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
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
  if (!res?.ok) return null;
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? null;
}

async function fetchPerplexityAnswer(prompt: string): Promise<string | null> {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) return null;

  const res = await fetchWithTimeout(
    "https://api.perplexity.ai/chat/completions",
    {
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
    },
  );
  if (!res?.ok) return null;
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? null;
}

async function fetchGoogleSearchContext(
  prompt: string,
  ctx: GoogleSearchRunContext,
): Promise<string | null> {
  try {
    const result = await searchGoogle(
      prompt,
      {
        num: 8,
        signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      },
      ctx,
    );
    if (!result) return null;
    return googleSearchContextText(result) || null;
  } catch {
    return null;
  }
}

async function fetchLiveAnswer(
  provider: LiveProvider,
  prompt: string,
  searchCtx: GoogleSearchRunContext,
): Promise<string | null> {
  if (provider === "openai") return fetchOpenAiAnswer(prompt);
  if (provider === "perplexity") return fetchPerplexityAnswer(prompt);
  return fetchGoogleSearchContext(prompt, searchCtx);
}

async function runPool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  if (items.length === 0) return;
  let index = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (index < items.length) {
        const i = index++;
        await fn(items[i]!);
      }
    },
  );
  await Promise.all(workers);
}

function probeBudget(plan: BillingPlan): {
  maxPrompts: number;
  livePlatforms: string[];
  browserPlatforms: BrowserScanPlatformName[];
} {
  const configuredLive = PLATFORMS.filter((name) => {
    const provider = LIVE_PLATFORM_PROVIDERS[name];
    if (!provider) return false;
    if (name === "Google AI Overviews" && shouldUseBrowserForGoogle(plan)) {
      return false;
    }
    if (provider === "openai") return Boolean(process.env.OPENAI_API_KEY);
    if (provider === "perplexity") return Boolean(process.env.PERPLEXITY_API_KEY);
    if (provider === "google") return googleSearchConfigured();
    return false;
  });

  let maxPrompts =
    plan === "fleet" ? 12 : plan === "pilot" ? 8 : configuredLive.length > 0 ? 3 : 0;
  const livePlatforms =
    plan === "free"
      ? configuredLive.slice(0, 2)
      : configuredLive;

  const callCap = MAX_LIVE_PROBE_CALLS[plan];
  if (livePlatforms.length > 0) {
    maxPrompts = Math.min(
      maxPrompts,
      Math.max(1, Math.floor(callCap / livePlatforms.length)),
    );
  }

  return {
    maxPrompts,
    livePlatforms,
    browserPlatforms: browserPlatformsForPlan(plan),
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

async function runBrowserPlatformProbes(input: {
  domain: string;
  prompts: string[];
  plan: BillingPlan;
  workspaceId?: string | null;
  browserPlatforms: BrowserScanPlatformName[];
}): Promise<PlatformProbeResult[]> {
  const checks: PlatformProbeResult[] = [];
  if (input.browserPlatforms.length === 0) return checks;

  const domain = input.domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const workspaceId = input.workspaceId?.trim();
  const scanCap = MAX_BROWSER_SCANS_PER_AUDIT[input.plan];
  if (!workspaceId || scanCap === 0) return checks;

  const browserTasks: BrowserProbeTask[] = [];
  for (let promptIndex = 0; promptIndex < input.prompts.length; promptIndex++) {
    const prompt = input.prompts[promptIndex]!;
    for (const platform of input.browserPlatforms) {
      browserTasks.push({ promptIndex, prompt, platform });
    }
  }

  const tasks = browserTasks.slice(0, scanCap);
  const probeStarted = Date.now();

  for (let i = 0; i < tasks.length; i++) {
    if (Date.now() - probeStarted > BROWSER_PROBE_WALL_MS) break;
    const task = tasks[i]!;
    const browserPlatformId = BROWSER_PLATFORM_ID_BY_NAME[task.platform];

    try {
      const result = await scanWithBrowser({
        platform: browserPlatformId,
        searchPrompt: task.prompt,
        brandDomain: domain,
        workspaceId,
        plan: input.plan,
      });
      checks.push(browserResultToProbe(result, task.platform, task.promptIndex));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Browser scan failed";
      checks.push({
        platform: task.platform,
        prompt: task.prompt,
        promptIndex: task.promptIndex,
        cited: false,
        checkMode: "live",
        notes: message,
        scanUnavailable: message.toLowerCase().includes("limit"),
      });
    }

    if (i < tasks.length - 1) {
      await delayBetweenBrowserScans();
    }
  }

  return checks;
}

/** Live probes only — safe to run in parallel with analyzeSite(). */
export async function runLivePlatformProbes(input: {
  domain: string;
  prompts: string[];
  plan: BillingPlan;
  workspaceId?: string | null;
}): Promise<PlatformProbeResult[]> {
  const domain = input.domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const brand = brandFromDomain(domain);
  const budget = probeBudget(input.plan);
  const promptsToProbe = input.prompts.slice(0, budget.maxPrompts);

  const tasks: ProbeTask[] = [];
  for (let promptIndex = 0; promptIndex < promptsToProbe.length; promptIndex++) {
    const prompt = promptsToProbe[promptIndex]!;
    for (const platform of budget.livePlatforms) {
      const provider = LIVE_PLATFORM_PROVIDERS[platform];
      if (!provider) continue;
      tasks.push({ promptIndex, prompt, platform, provider });
    }
  }

  const checks: PlatformProbeResult[] = [];
  const searchCtx: GoogleSearchRunContext = {};
  const probeStarted = Date.now();

  await runPool(tasks, PROBE_CONCURRENCY, async (task) => {
    if (Date.now() - probeStarted > LIVE_PROBE_WALL_MS) return;
    try {
      const answer = await fetchLiveAnswer(task.provider, task.prompt, searchCtx);
      if (answer === null) return;
      checks.push({
        platform: task.platform,
        prompt: task.prompt,
        promptIndex: task.promptIndex,
        cited: textMentionsBrand(answer, domain, brand),
        checkMode: "live",
      });
    } catch {
      /* Individual probe failure — continue with partial live checks */
    }
  });

  const browserChecks = await runBrowserPlatformProbes({
    domain,
    prompts: promptsToProbe,
    plan: input.plan,
    workspaceId: input.workspaceId,
    browserPlatforms: budget.browserPlatforms,
  });

  return [...checks, ...browserChecks];
}

export function buildPlatformPresence(
  checks: PlatformProbeResult[],
  siteSignals: SiteSignals,
  promptCount: number,
): PlatformPresenceRow[] {
  const liveCitedPrompts = new Set(
    checks.filter((c) => c.cited).map((c) => c.promptIndex),
  );
  const liveCitationRate =
    promptCount > 0 ? liveCitedPrompts.size / promptCount : 0;

  const livePresence = aggregateLivePresence(checks);
  return PLATFORMS.map((name) => {
    const live = livePresence.get(name);
    if (live) return live;
    return inferPlatformPresence(name, siteSignals.geoScore, liveCitationRate);
  });
}

export async function runPlatformMonitoring(input: {
  domain: string;
  prompts: string[];
  plan: BillingPlan;
  siteSignals: SiteSignals;
  workspaceId?: string | null;
}): Promise<{
  checks: PlatformProbeResult[];
  platforms: PlatformPresenceRow[];
}> {
  const checks = await runLivePlatformProbes({
    domain: input.domain,
    prompts: input.prompts,
    plan: input.plan,
    workspaceId: input.workspaceId,
  });
  const platforms = buildPlatformPresence(
    checks,
    input.siteSignals,
    input.prompts.length,
  );
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
