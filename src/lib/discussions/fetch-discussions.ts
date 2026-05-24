import type { DiscussionThread } from "@/lib/api-types";

async function fetchHackerNews(query: string): Promise<DiscussionThread[]> {
  const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=6`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    hits?: {
      objectID?: string;
      title?: string;
      url?: string;
      points?: number;
      num_comments?: number;
    }[];
  };

  return (data.hits ?? []).map((hit) => ({
    id: `hn-${hit.objectID ?? hit.title}`,
    title: hit.title ?? "Untitled",
    source: "hackernews" as const,
    sourceLabel: "Hacker News",
    url:
      hit.url ??
      `https://news.ycombinator.com/item?id=${hit.objectID ?? ""}`,
    score: hit.points ?? 0,
    comments: hit.num_comments ?? 0,
  }));
}

async function fetchStackExchange(query: string): Promise<DiscussionThread[]> {
  const key = process.env.STACKEXCHANGE_KEY;
  const params = new URLSearchParams({
    order: "desc",
    sort: "relevance",
    q: query,
    site: "stackoverflow",
    pagesize: "6",
  });
  if (key) params.set("key", key);

  const res = await fetch(
    `https://api.stackexchange.com/2.3/search/advanced?${params}`,
    { next: { revalidate: 3600 } },
  );
  if (!res.ok) return [];

  const data = (await res.json()) as {
    items?: {
      question_id?: number;
      title?: string;
      link?: string;
      score?: number;
      answer_count?: number;
    }[];
  };

  return (data.items ?? []).map((item) => ({
    id: `so-${item.question_id}`,
    title: item.title ?? "Untitled",
    source: "stackexchange" as const,
    sourceLabel: "Stack Overflow",
    url: item.link ?? "https://stackoverflow.com",
    score: item.score ?? 0,
    comments: item.answer_count ?? 0,
  }));
}

async function fetchSerper(query: string): Promise<DiscussionThread[]> {
  const key = process.env.SERPER_API_KEY;
  if (!key) return [];

  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: `${query} forum OR discussion OR review`,
      num: 6,
    }),
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    console.error("Serper search failed", res.status);
    return [];
  }

  const data = (await res.json()) as {
    organic?: {
      title?: string;
      link?: string;
      position?: number;
    }[];
  };

  return (data.organic ?? []).map((item, i) => {
    const position = item.position ?? i + 1;
    return {
      id: `serper-${encodeURIComponent(item.link ?? String(i))}`,
      title: item.title ?? "Untitled",
      source: "serper" as const,
      sourceLabel: "Web (Serper)",
      url: item.link ?? "#",
      score: Math.max(1, 12 - position),
      comments: 0,
    };
  });
}

/** Tavily — Brave/Serp alternative for buyer-intent web pages */
async function fetchTavily(query: string): Promise<DiscussionThread[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return [];

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: key,
      query: `${query} forum discussion review`,
      search_depth: "basic",
      max_results: 6,
      include_answer: false,
    }),
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    console.error("Tavily search failed", res.status);
    return [];
  }

  const data = (await res.json()) as {
    results?: {
      title?: string;
      url?: string;
      score?: number;
    }[];
  };

  return (data.results ?? []).map((item, i) => ({
    id: `tavily-${encodeURIComponent(item.url ?? String(i))}`,
    title: item.title ?? "Untitled",
    source: "tavily" as const,
    sourceLabel: "Web (Tavily)",
    url: item.url ?? "#",
    score: Math.round((item.score ?? 0.5) * 10),
    comments: 0,
  }));
}

/** Serper first; Tavily fills in if Serper missing or returns nothing */
async function fetchWebSearch(query: string): Promise<DiscussionThread[]> {
  const serper = await fetchSerper(query);
  if (serper.length > 0) return serper;
  return fetchTavily(query);
}

export async function fetchDiscussions(query: string): Promise<DiscussionThread[]> {
  const [hn, so, web] = await Promise.all([
    fetchHackerNews(query),
    fetchStackExchange(query),
    fetchWebSearch(query),
  ]);

  const merged = [...hn, ...so, ...web];
  merged.sort((a, b) => b.score - a.score);
  return merged.slice(0, 15);
}
