import type { PromptResult } from "@/lib/api-types";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import { domainSeed } from "@/lib/dashboard";
import {
  buildCompetitorBenchmark,
  promptRowsForWorkspace,
} from "@/lib/dashboard-data";
import { getFixForGap } from "@/lib/geo/fixes";
import type { BillingPlan } from "@/lib/billing/types";
import { buildCompetitorLimits, type CompetitorLimits } from "@/lib/competitors/limits";

export type CompetitorGapStatus = "advantage" | "tied" | "opportunity" | "gap";

export type CompetitorPromptRow = {
  prompt: string;
  yourStatus: "Cited" | "Not cited";
  theirStatus: "Cited" | "Not cited" | "Unknown";
  gap: CompetitorGapStatus;
  gapLabel: string;
  actionGap: string;
  yourReason: string;
};

export type StealCitationAction = {
  prompt: string;
  competitorDomain: string;
  citedBecause: string;
  beatThemAction: string;
  fixTitle: string;
  estimatedLiftPercent: number;
  actionGap: string;
};

export type DiscoveredCompetitor = {
  domain: string;
  citationHits: number;
  source: "audit" | "backlinks" | "gaps";
  alreadyTracked: boolean;
};

export type CompetitorCardData = {
  domain: string;
  yourCitationRate: number;
  theirCitationRate: number;
  beatingYouOn: string[];
  youBeatingThemOn: string[];
  yourTrend: number[];
  theirTrend: number[];
  lastUpdated: string | null;
  prompts: CompetitorPromptRow[];
  stealActions: StealCitationAction[];
};

export type CompetitorIntelligence = {
  available: boolean;
  unavailableReason?: string;
  limits: CompetitorLimits;
  competitors: CompetitorCardData[];
  discovered: DiscoveredCompetitor[];
  lastAuditAt: string | null;
};

function normalizeBrand(name: string): string {
  return name.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
}

function gapLabelFor(status: CompetitorGapStatus): string {
  switch (status) {
    case "advantage":
      return "+1 ↑ Advantage";
    case "tied":
      return "Tied";
    case "opportunity":
      return "Opportunity";
    case "gap":
      return "-1 ↓ Gap";
  }
}

function promptGapForCompetitor(
  youCited: boolean,
  leader: string,
  competitor: string,
): CompetitorGapStatus {
  const normalizedLeader = normalizeBrand(leader);
  const normalizedCompetitor = normalizeBrand(competitor);

  if (youCited) {
    return "advantage";
  }
  if (normalizedLeader === normalizedCompetitor) {
    return "gap";
  }
  return "opportunity";
}

function gapForPrompt(prompt: string): string {
  return `On-site content doesn't support prompt: "${prompt}"`;
}

function citedBecauseReason(
  yourReason: string,
  competitor: string,
  prompt: string,
): string {
  const comp = normalizeBrand(competitor);
  if (yourReason.toLowerCase().includes("faq") || yourReason.toLowerCase().includes("schema")) {
    return `${comp} likely has FAQ or structured schema covering "${prompt}"`;
  }
  if (yourReason.toLowerCase().includes("overlap") || yourReason.toLowerCase().includes("content")) {
    return `${comp} has stronger topical content aligned with "${prompt}"`;
  }
  if (yourReason.toLowerCase().includes("live")) {
    return `${comp} appears on live AI surfaces for "${prompt}" while you do not`;
  }
  return `${comp} is positioned as the default recommendation for "${prompt}" in your category`;
}

function beatThemAction(
  gap: string,
  competitor: string,
  prompt: string,
  domain: string,
): { action: string; fixTitle: string } {
  const fix = getFixForGap(gap, domain);
  const comp = normalizeBrand(competitor);
  if (fix.id === "faq-schema") {
    return {
      fixTitle: fix.title,
      action: `Publish FAQ schema and a direct answer page targeting "${prompt}" to outrank ${comp}`,
    };
  }
  if (fix.id === "custom-content" || fix.id === "content") {
    return {
      fixTitle: fix.title,
      action: `Publish a comparison or alternatives page targeting "${prompt}" — position against ${comp}`,
    };
  }
  return {
    fixTitle: fix.title,
    action: fix.instructions,
  };
}

function trendForDomain(
  workspace: WorkspaceSnapshot,
  baseRate: number,
  domain: string,
  isYou: boolean,
): number[] {
  const history = workspace.citationHistory ?? [];
  if (history.length >= 4) {
    return history.slice(-4).map((point, i) => {
      const seed = domainSeed(`${domain}:${i}`) % 9;
      const bias = isYou ? 1 : 0.85;
      return Math.min(100, Math.max(0, Math.round(point.visibilityIndex * bias + seed)));
    });
  }

  const seed = domainSeed(domain) % 11;
  const w1 = Math.max(0, Math.round(baseRate * 0.2 + seed));
  const w2 = Math.max(0, Math.round(baseRate * 0.45 + (seed % 4)));
  const w3 = Math.max(0, Math.round(baseRate * 0.72 + (seed % 3)));
  return [w1, w2, w3, baseRate];
}

function promptReasonMap(workspace: WorkspaceSnapshot): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of workspace.promptResults ?? []) {
    map.set(row.prompt.trim().toLowerCase(), row.reason);
  }
  return map;
}

export function buildCompetitorCard(
  workspace: WorkspaceSnapshot,
  competitor: string,
  totalPrompts: number,
): CompetitorCardData {
  const rows = promptRowsForWorkspace(workspace).filter((r) => r.fromAudit);
  const normalizedCompetitor = normalizeBrand(competitor);
  const reasons = promptReasonMap(workspace);

  const prompts: CompetitorPromptRow[] = rows.map((row) => {
    const youCited = Boolean(row.cited);
    const leader =
      row.leader === "You"
        ? normalizeBrand(workspace.domain)
        : normalizeBrand(
            row.leader === "Competitor"
              ? workspace.competitors[0] ?? competitor
              : row.leader,
          );
    const gap = promptGapForCompetitor(youCited, leader, normalizedCompetitor);
    const theirStatus: CompetitorPromptRow["theirStatus"] =
      gap === "gap" ? "Cited" : gap === "advantage" ? "Not cited" : "Unknown";

    return {
      prompt: row.prompt,
      yourStatus: youCited ? "Cited" : "Not cited",
      theirStatus,
      gap,
      gapLabel: gapLabelFor(gap),
      actionGap: gapForPrompt(row.prompt),
      yourReason: reasons.get(row.prompt.trim().toLowerCase()) ?? "",
    };
  });

  const citedCount = prompts.filter((p) => p.yourStatus === "Cited").length;
  const theirLed = prompts.filter((p) => p.gap === "gap").length;
  const yourCitationRate =
    totalPrompts > 0 ? Math.round((citedCount / totalPrompts) * 100) : 0;
  const theirCitationRate =
    totalPrompts > 0 ? Math.round((theirLed / totalPrompts) * 100) : 0;

  const beatingYouOn = prompts
    .filter((p) => p.gap === "gap")
    .map((p) => p.prompt)
    .slice(0, 5);
  const youBeatingThemOn = prompts
    .filter((p) => p.gap === "advantage")
    .map((p) => p.prompt)
    .slice(0, 5);

  const stealActions: StealCitationAction[] = prompts
    .filter((p) => p.gap === "gap")
    .map((p) => {
      const { action, fixTitle } = beatThemAction(
        p.actionGap,
        normalizedCompetitor,
        p.prompt,
        workspace.domain,
      );
      return {
        prompt: p.prompt,
        competitorDomain: normalizedCompetitor,
        citedBecause: citedBecauseReason(p.yourReason, normalizedCompetitor, p.prompt),
        beatThemAction: action,
        fixTitle,
        estimatedLiftPercent:
          totalPrompts > 0 ? Math.round((1 / totalPrompts) * 100) : 0,
        actionGap: p.actionGap,
      };
    });

  return {
    domain: normalizedCompetitor,
    yourCitationRate,
    theirCitationRate,
    beatingYouOn,
    youBeatingThemOn,
    yourTrend: trendForDomain(workspace, yourCitationRate, workspace.domain, true),
    theirTrend: trendForDomain(
      workspace,
      theirCitationRate,
      normalizedCompetitor,
      false,
    ),
    lastUpdated: workspace.updatedAt ?? null,
    prompts,
    stealActions,
  };
}

const DOMAIN_IN_TEXT_RE =
  /(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}/gi;

function extractDomainsFromText(text: string): string[] {
  const matches = text.match(DOMAIN_IN_TEXT_RE) ?? [];
  return matches.map((m) => normalizeBrand(m.toLowerCase()));
}

export function discoverCompetitorCandidates(input: {
  workspace: WorkspaceSnapshot;
  backlinkDomains?: string[];
}): DiscoveredCompetitor[] {
  const yourDomain = normalizeBrand(input.workspace.domain);
  const tracked = new Set(
    input.workspace.competitors.map((c) => normalizeBrand(c).toLowerCase()),
  );
  tracked.add(yourDomain.toLowerCase());

  const counts = new Map<string, { hits: number; sources: Set<DiscoveredCompetitor["source"]> }>();

  function bump(domain: string, source: DiscoveredCompetitor["source"], weight = 1) {
    const key = normalizeBrand(domain).toLowerCase();
    if (!key || tracked.has(key) || key === yourDomain.toLowerCase()) return;
    if (key.includes("google.") || key.includes("github.") || key.includes("wikipedia.")) {
      return;
    }
    const row = counts.get(key) ?? { hits: 0, sources: new Set() };
    row.hits += weight;
    row.sources.add(source);
    counts.set(key, row);
  }

  for (const pr of input.workspace.promptResults ?? []) {
    for (const domain of extractDomainsFromText(pr.reason)) {
      bump(domain, "audit", 2);
    }
  }

  for (const gap of input.workspace.gaps ?? []) {
    for (const domain of extractDomainsFromText(gap)) {
      bump(domain, "gaps", 2);
    }
  }

  for (const domain of input.backlinkDomains ?? []) {
    bump(domain, "backlinks", 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1].hits - a[1].hits)
    .slice(0, 6)
    .map(([domain, meta]) => ({
      domain,
      citationHits: meta.hits,
      source: meta.sources.has("audit")
        ? "audit"
        : meta.sources.has("gaps")
          ? "gaps"
          : "backlinks",
      alreadyTracked: tracked.has(domain),
    }));
}

export function buildCompetitorIntelligence(input: {
  workspace: WorkspaceSnapshot;
  plan: BillingPlan;
  backlinkDomains?: string[];
}): CompetitorIntelligence {
  const { workspace, plan } = input;
  const tracked = workspace.competitors.map(normalizeBrand).filter(Boolean);
  const limits = buildCompetitorLimits(plan, tracked.length);
  const rows = promptRowsForWorkspace(workspace);
  const benchmark = buildCompetitorBenchmark(workspace, rows);
  const auditRows = rows.filter((r) => r.fromAudit);
  const totalPrompts = auditRows.length;

  if (!workspace.hasRealAudit) {
    return {
      available: false,
      unavailableReason:
        "Run a citation audit to unlock competitor intelligence from your money prompts.",
      limits,
      competitors: [],
      discovered: [],
      lastAuditAt: null,
    };
  }

  const competitors = tracked.map((domain) =>
    buildCompetitorCard(workspace, domain, totalPrompts),
  );

  const discovered = discoverCompetitorCandidates({
    workspace,
    backlinkDomains: input.backlinkDomains,
  }).filter((d) => !d.alreadyTracked);

  return {
    available: benchmark.available || tracked.length > 0,
    unavailableReason: benchmark.unavailableReason,
    limits,
    competitors,
    discovered: discovered.slice(0, 3),
    lastAuditAt: workspace.updatedAt ?? null,
  };
}

export function competitorRateFromAudit(
  auditPrompts: PromptResult[],
  competitor: string,
  allCompetitors: string[],
): number {
  const total = auditPrompts.length;
  if (total === 0) return 0;
  const normalized = normalizeBrand(competitor);
  const primary = normalizeBrand(allCompetitors[0] ?? competitor);
  let led = 0;
  for (const pr of auditPrompts) {
    if (!pr.cited && normalized === primary) {
      led += 1;
    } else if (!pr.cited && normalized !== primary) {
      led += 0;
    }
  }
  return Math.round((led / total) * 100);
}
