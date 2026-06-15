import type { EditorialPillarId } from "./types";
import { EDITORIAL_PILLARS } from "./constants";

export function editorialPillarTitle(id: EditorialPillarId): string {
  return EDITORIAL_PILLARS.find((p) => p.id === id)?.title ?? id;
}

/** Map content calendar rows to editorial pillars. */
export function pillarForCalendarFormat(
  format: string,
  rationale: string,
): EditorialPillarId {
  const f = format.toLowerCase();
  const r = rationale.toLowerCase();

  if (f.includes("comparison")) return "paid-organic";
  if (f.includes("faq") || r.includes("schema") || r.includes("capsule")) {
    return "technical-seo";
  }
  if (f.includes("proof") || r.includes("case study") || r.includes("entity")) {
    return "agency-growth";
  }
  if (r.includes("citation") || r.includes("gap")) return "geo";
  if (f.includes("pillar")) return "geo";
  return "seo-automation";
}

export type MoneyPromptIntent =
  | "comparison"
  | "alternatives"
  | "pricing"
  | "roi"
  | "buyer-fit"
  | "implementation";

export function pillarForMoneyPromptIntent(
  intent: MoneyPromptIntent,
): EditorialPillarId {
  switch (intent) {
    case "comparison":
    case "alternatives":
    case "pricing":
      return "paid-organic";
    case "implementation":
      return "seo-automation";
    case "roi":
      return "agency-growth";
    case "buyer-fit":
    default:
      return "geo";
  }
}

export function pickDiverseByPillar<T extends { pillar: EditorialPillarId; topic: string }>(
  items: T[],
  limit: number,
): T[] {
  const seenTopics = new Set<string>();
  const deduped = items.filter((item) => {
    const key = item.topic.toLowerCase().trim();
    if (!key || seenTopics.has(key)) return false;
    seenTopics.add(key);
    return true;
  });

  const picked: T[] = [];
  const usedPillars = new Set<EditorialPillarId>();

  for (const item of deduped) {
    if (picked.length >= limit) break;
    if (!usedPillars.has(item.pillar)) {
      picked.push(item);
      usedPillars.add(item.pillar);
    }
  }

  for (const item of deduped) {
    if (picked.length >= limit) break;
    if (!picked.includes(item)) picked.push(item);
  }

  return picked;
}
