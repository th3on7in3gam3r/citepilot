import type { WorkspaceSnapshot } from "@/lib/dashboard";
import { domainSeed } from "@/lib/dashboard";
import { promptRowsForWorkspace } from "@/lib/dashboard-data";

export type KeywordRow = {
  id: string;
  keyword: string;
  url: string;
  category: string;
  rank: number;
  trend7d: number;
  trend30d: number;
  trendLife: number;
  active: boolean;
};

const CATEGORIES = [
  "Immigration Lawyers",
  "Corporate Lawyer",
  "Legal Services",
  "Healthcare SaaS",
  "GEO Tools",
  "Citation Tracking",
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function buildKeywordRows(workspace: WorkspaceSnapshot): KeywordRow[] {
  const seed = domainSeed(workspace.domain);
  const domain = workspace.domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const prompts = promptRowsForWorkspace(workspace);
  const monitored = workspace.preferences?.monitoredPrompts ?? [];

  const sources = [
    ...prompts.map((p) => ({ text: p.prompt, cited: Boolean(p.cited) })),
    ...monitored.map((text) => ({ text, cited: false })),
    { text: workspace.buyerQuestion, cited: false },
  ].filter((s) => s.text?.trim());

  const unique = new Map<string, { text: string; cited: boolean }>();
  for (const s of sources) {
    if (!unique.has(s.text)) unique.set(s.text, s);
  }

  return Array.from(unique.entries())
    .slice(0, 20)
    .map(([text, meta], i) => {
      const h = hash(text + String(seed));
      const rank = meta.cited ? 4 + (h % 30) : 35 + (h % 120);
      const trend7d = (h % 7) - 3;
      const trend30d = (h % 11) - 5;
      const trendLife = (h % 15) - 4;
      return {
        id: `kw-${i}`,
        keyword: text.length > 48 ? `${text.slice(0, 48)}…` : text,
        url: `https://${domain}/${text.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 32)}`,
        category: CATEGORIES[(seed + i) % CATEGORIES.length],
        rank,
        trend7d,
        trend30d,
        trendLife,
        // All tracked prompts are active — "active" means being monitored, not cited
        active: true,
      };
    });
}

export function keywordRankingSummary(rows: KeywordRow[]) {
  const up = rows.filter((r) => r.trend7d > 0).length;
  const top3 = rows.filter((r) => r.rank <= 3).length;
  const top20 = rows.filter((r) => r.rank <= 20).length;
  const top30 = rows.filter((r) => r.rank <= 30).length;
  const top100 = rows.filter((r) => r.rank <= 100).length;
  return { up, top3, top20, top30, top100, total: rows.length };
}
