import type { FaqItem } from "@/lib/marketing/site-faq";

const STOP = new Set([
  "a",
  "an",
  "the",
  "is",
  "are",
  "do",
  "does",
  "how",
  "what",
  "when",
  "where",
  "why",
  "can",
  "i",
  "you",
  "to",
  "of",
  "and",
  "or",
  "for",
  "in",
  "on",
  "with",
  "my",
  "me",
]);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

function scoreFaq(queryTokens: string[], item: FaqItem): number {
  const hay = tokens(`${item.q} ${item.a}`);
  if (hay.length === 0 || queryTokens.length === 0) return 0;
  const haySet = new Set(hay);
  let hits = 0;
  for (const t of queryTokens) {
    if (haySet.has(t)) hits += 1;
  }
  return hits / queryTokens.length;
}

const BUYING_INTENT =
  /\b(price|pricing|pilot|fleet|buy|purchase|demo|sales|talk to|contact|consult|agency|upgrade|plan)\b/i;

/** Keyword overlap retrieval when OpenAI is unavailable. */
export function retrieveFaqAnswer(
  query: string,
  knowledge: FaqItem[],
): { reply: string; suggestLead: boolean } {
  const qTokens = tokens(query);
  let best: FaqItem | null = null;
  let bestScore = 0;

  for (const item of knowledge) {
    const s = scoreFaq(qTokens, item);
    if (s > bestScore) {
      bestScore = s;
      best = item;
    }
  }

  const suggestLead = BUYING_INTENT.test(query);

  if (!best || bestScore < 0.15) {
    return {
      reply:
        "I am not sure from our FAQ. Try /pricing for plans, /start for a free audit, or /consulting to leave a message for human review.",
      suggestLead,
    };
  }

  return {
    reply: best.a,
    suggestLead,
  };
}

export function stripSuggestLeadToken(text: string): {
  reply: string;
  suggestLead: boolean;
} {
  const has = text.includes("[[SUGGEST_LEAD]]");
  const reply = text
    .replace(/\[\[SUGGEST_LEAD\]\]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { reply, suggestLead: has };
}
