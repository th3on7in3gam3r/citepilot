export type GoogleOrganicHit = {
  title?: string;
  link?: string;
  snippet?: string;
  position?: number;
};

export type GoogleSearchResponse = {
  provider: "serper" | "serpapi";
  organic: GoogleOrganicHit[];
  answerBoxSnippet?: string;
  answerBoxTitle?: string;
  aiOverviewText?: string;
};

type SearchOptions = {
  num?: number;
  signal?: AbortSignal;
  /** Next.js fetch revalidate seconds; omit for no-store */
  revalidate?: number;
};

/** Per-request Serper disable (e.g. after 403) — pass through audit probe runs. */
export type GoogleSearchRunContext = {
  serperDisabled?: boolean;
  serperWarned?: boolean;
};

function disableSerper(ctx: GoogleSearchRunContext | undefined, status: number): void {
  if (!ctx) return;
  ctx.serperDisabled = true;
  if (!ctx.serperWarned) {
    ctx.serperWarned = true;
    console.warn(
      `Serper API rejected (${status}) — skipping Serper for this run; check SERPER_API_KEY or use SERPAPI_API_KEY`,
    );
  }
}

export function serperConfigured(): boolean {
  return Boolean(process.env.SERPER_API_KEY?.trim());
}

export function serpApiConfigured(): boolean {
  return Boolean(process.env.SERPAPI_API_KEY?.trim());
}

/** Serper or SerpAPI — used for Google AI Overviews probes and organic search. */
export function googleSearchConfigured(): boolean {
  return serperConfigured() || serpApiConfigured();
}

export function webDiscoveryConfigured(): boolean {
  return (
    googleSearchConfigured() || Boolean(process.env.TAVILY_API_KEY?.trim())
  );
}

function extractSerpApiAiOverview(raw: unknown): string | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const overview = raw as {
    text_blocks?: { type?: string; snippet?: string; list?: { snippet?: string }[] }[];
    snippet?: string;
  };
  if (typeof overview.snippet === "string" && overview.snippet.trim()) {
    return overview.snippet.trim();
  }
  const parts: string[] = [];
  for (const block of overview.text_blocks ?? []) {
    if (block.snippet?.trim()) parts.push(block.snippet.trim());
    for (const item of block.list ?? []) {
      if (item.snippet?.trim()) parts.push(item.snippet.trim());
    }
  }
  return parts.length > 0 ? parts.join("\n") : undefined;
}

async function fetchSerper(
  q: string,
  options: SearchOptions,
  ctx?: GoogleSearchRunContext,
): Promise<GoogleSearchResponse | null> {
  const key = process.env.SERPER_API_KEY?.trim();
  if (!key || ctx?.serperDisabled) return null;

  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q, num: options.num ?? 8 }),
      cache: options.revalidate != null ? "force-cache" : "no-store",
      ...(options.revalidate != null
        ? { next: { revalidate: options.revalidate } }
        : {}),
      ...(options.signal ? { signal: options.signal } : {}),
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        disableSerper(ctx, res.status);
      } else {
        console.error("Serper search failed", res.status);
      }
      return null;
    }

    const data = (await res.json()) as {
      answerBox?: { snippet?: string; title?: string };
      organic?: GoogleOrganicHit[];
    };

    return {
      provider: "serper",
      organic: data.organic ?? [],
      answerBoxSnippet: data.answerBox?.snippet,
      answerBoxTitle: data.answerBox?.title,
    };
  } catch {
    return null;
  }
}

async function fetchSerpApi(
  q: string,
  options: SearchOptions,
): Promise<GoogleSearchResponse | null> {
  const key = process.env.SERPAPI_API_KEY?.trim();
  if (!key) return null;

  try {
    const params = new URLSearchParams({
      engine: "google",
      q,
      api_key: key,
      num: String(options.num ?? 8),
    });

    const res = await fetch(`https://serpapi.com/search.json?${params}`, {
      cache: options.revalidate != null ? "force-cache" : "no-store",
      ...(options.revalidate != null
        ? { next: { revalidate: options.revalidate } }
        : {}),
      ...(options.signal ? { signal: options.signal } : {}),
    });
    if (!res.ok) {
      console.error("SerpAPI search failed", res.status);
      return null;
    }

    const data = (await res.json()) as {
      error?: string;
      answer_box?: { snippet?: string; title?: string };
      ai_overview?: unknown;
      organic_results?: {
        position?: number;
        title?: string;
        link?: string;
        snippet?: string;
      }[];
    };

    if (data.error) {
      console.error("SerpAPI search error", data.error);
      return null;
    }

    return {
      provider: "serpapi",
      organic: (data.organic_results ?? []).map((row) => ({
        position: row.position,
        title: row.title,
        link: row.link,
        snippet: row.snippet,
      })),
      answerBoxSnippet: data.answer_box?.snippet,
      answerBoxTitle: data.answer_box?.title,
      aiOverviewText: extractSerpApiAiOverview(data.ai_overview),
    };
  } catch {
    return null;
  }
}

/** Google organic search — prefers Serper when both keys are set. */
export async function searchGoogle(
  q: string,
  options: SearchOptions = {},
  ctx?: GoogleSearchRunContext,
): Promise<GoogleSearchResponse | null> {
  try {
    if (serperConfigured() && !ctx?.serperDisabled) {
      const result = await fetchSerper(q, options, ctx);
      if (result && result.organic.length > 0) return result;
      if (result && (result.answerBoxSnippet || result.answerBoxTitle)) {
        return result;
      }
    }

    if (serpApiConfigured()) {
      return fetchSerpApi(q, options);
    }

    return null;
  } catch {
    return null;
  }
}

export function googleSearchContextText(result: GoogleSearchResponse): string {
  const parts: string[] = [];
  if (result.aiOverviewText) parts.push(result.aiOverviewText);
  if (result.answerBoxSnippet) parts.push(result.answerBoxSnippet);
  if (result.answerBoxTitle) parts.push(result.answerBoxTitle);
  for (const row of result.organic) {
    if (row.title) parts.push(row.title);
    if (row.snippet) parts.push(row.snippet);
    if (row.link) parts.push(row.link);
  }
  return parts.join("\n");
}
