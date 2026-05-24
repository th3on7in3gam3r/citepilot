import { v4 as uuidv4 } from "uuid";
import {
  computeDomainRating,
  discoverBacklinkSources,
  fetchOpenPageRank,
  profileIsStale,
} from "@/lib/backlinks/discover";
import type {
  BacklinkDashboard,
  BacklinkNetworkState,
  BacklinkPlacement,
  BacklinkProfile,
  BacklinkSource,
  NetworkPeer,
  PlacementStatus,
} from "@/lib/backlinks/types";
import { dbAll, dbGet, dbRun } from "@/lib/db";
import { getLatestAuditForWorkspace } from "@/lib/audit/run-audit";
import { getBillingByUserId, creditsForPlan } from "@/lib/billing/store";
import { isPaidPlan } from "@/lib/billing/types";
import { userHasPilotAccess } from "@/lib/billing/access";

type ProfileRow = {
  workspace_id: string;
  domain: string;
  domain_rating: number;
  open_pagerank: number | null;
  referring_count: number;
  discovered_at: string;
};

type SourceRow = {
  id: string;
  workspace_id: string;
  url: string;
  title: string;
  source_domain: string;
  discovery_source: string;
  discovered_at: string;
};

type NetworkRow = {
  workspace_id: string;
  user_id: string | null;
  domain: string;
  business_type: string | null;
  credits_total: number;
  credits_used: number;
  opted_in: number;
  opted_in_at: string | null;
  updated_at: string;
};

type PlacementRow = {
  id: string;
  requester_workspace_id: string;
  partner_workspace_id: string | null;
  target_url: string;
  anchor_text: string;
  context_note: string | null;
  status: string;
  credits_cost: number;
  created_at: string;
  updated_at: string;
};

const DEFAULT_CREDITS_PILOT = 100;
const DEFAULT_CREDITS_FREE = 25;

function mapSource(row: SourceRow): BacklinkSource {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    sourceDomain: row.source_domain,
    discoverySource: row.discovery_source as BacklinkSource["discoverySource"],
  };
}

async function creditsForUser(userId: string | null): Promise<number> {
  if (!userId) return DEFAULT_CREDITS_FREE;
  const billing = await getBillingByUserId(userId);
  if (billing && isPaidPlan(billing)) {
    return creditsForPlan(
      billing.plan,
      billing.status === "active" || billing.status === "trialing",
    );
  }
  const pilot = await userHasPilotAccess(userId);
  return pilot ? DEFAULT_CREDITS_PILOT : DEFAULT_CREDITS_FREE;
}

export async function ensureNetworkRow(input: {
  workspaceId: string;
  userId: string | null;
  domain: string;
  businessType: string;
}): Promise<NetworkRow> {
  const existing = await dbGet<NetworkRow>(
    `SELECT * FROM backlink_network WHERE workspace_id = ?`,
    [input.workspaceId],
  );
  const now = new Date().toISOString();
  const credits = await creditsForUser(input.userId);

  if (existing) {
    if (credits > existing.credits_total) {
      await dbRun(
        `UPDATE backlink_network SET credits_total = ?, updated_at = ? WHERE workspace_id = ?`,
        [credits, now, input.workspaceId],
      );
      return (await dbGet<NetworkRow>(
        `SELECT * FROM backlink_network WHERE workspace_id = ?`,
        [input.workspaceId],
      ))!;
    }
    return existing;
  }

  await dbRun(
    `INSERT INTO backlink_network
     (workspace_id, user_id, domain, business_type, credits_total, credits_used, opted_in, opted_in_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 0, 0, NULL, ?)`,
    [
      input.workspaceId,
      input.userId,
      input.domain,
      input.businessType || null,
      credits,
      now,
    ],
  );
  return (await dbGet<NetworkRow>(
    `SELECT * FROM backlink_network WHERE workspace_id = ?`,
    [input.workspaceId],
  ))!;
}

function mapNetworkState(row: NetworkRow): BacklinkNetworkState {
  return {
    optedIn: row.opted_in === 1,
    optedInAt: row.opted_in_at,
    creditsTotal: row.credits_total,
    creditsUsed: row.credits_used,
    creditsRemaining: Math.max(0, row.credits_total - row.credits_used),
  };
}

export async function setNetworkOptIn(input: {
  workspaceId: string;
  userId: string | null;
  domain: string;
  businessType: string;
  optedIn: boolean;
}): Promise<BacklinkNetworkState> {
  const row = await ensureNetworkRow(input);
  const now = new Date().toISOString();
  await dbRun(
    `UPDATE backlink_network
     SET opted_in = ?, opted_in_at = ?, updated_at = ?
     WHERE workspace_id = ?`,
    [
      input.optedIn ? 1 : 0,
      input.optedIn ? row.opted_in_at ?? now : null,
      now,
      input.workspaceId,
    ],
  );
  const updated = await dbGet<NetworkRow>(
    `SELECT * FROM backlink_network WHERE workspace_id = ?`,
    [input.workspaceId],
  );
  return mapNetworkState(updated!);
}

export async function refreshBacklinkProfile(input: {
  workspaceId: string;
  domain: string;
  competitors: string[];
}): Promise<BacklinkProfile> {
  const audit = await getLatestAuditForWorkspace(input.workspaceId);
  const geoScore = audit?.siteSignals.geoScore ?? null;

  const [sources, openPageRank] = await Promise.all([
    discoverBacklinkSources({
      domain: input.domain,
      competitors: input.competitors,
    }),
    fetchOpenPageRank(input.domain),
  ]);

  const referringCount = sources.filter((s) => s.discoverySource !== "competitor").length;
  const domainRating = computeDomainRating({
    openPageRank,
    geoScore,
    referringCount,
  });

  const now = new Date().toISOString();

  await dbRun(
    `INSERT INTO backlink_profiles
     (workspace_id, domain, domain_rating, open_pagerank, referring_count, discovered_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(workspace_id) DO UPDATE SET
       domain = excluded.domain,
       domain_rating = excluded.domain_rating,
       open_pagerank = excluded.open_pagerank,
       referring_count = excluded.referring_count,
       discovered_at = excluded.discovered_at`,
    [
      input.workspaceId,
      input.domain,
      domainRating,
      openPageRank,
      referringCount,
      now,
    ],
  );

  await dbRun(
    `DELETE FROM backlink_sources WHERE workspace_id = ?`,
    [input.workspaceId],
  );

  for (const source of sources) {
    await dbRun(
      `INSERT INTO backlink_sources
       (id, workspace_id, url, title, source_domain, discovery_source, discovered_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(workspace_id, url) DO UPDATE SET
         title = excluded.title,
         source_domain = excluded.source_domain,
         discovery_source = excluded.discovery_source,
         discovered_at = excluded.discovered_at`,
      [
        uuidv4(),
        input.workspaceId,
        source.url,
        source.title,
        source.sourceDomain,
        source.discoverySource,
        now,
      ],
    );
  }

  return {
    domain: input.domain,
    domainRating,
    openPageRank,
    referringCount,
    discoveredAt: now,
    sources,
    stale: false,
  };
}

async function loadProfile(
  workspaceId: string,
  domain: string,
): Promise<BacklinkProfile> {
  const row = await dbGet<ProfileRow>(
    `SELECT * FROM backlink_profiles WHERE workspace_id = ?`,
    [workspaceId],
  );

  const sourceRows = await dbAll<SourceRow>(
    `SELECT * FROM backlink_sources WHERE workspace_id = ? ORDER BY discovered_at DESC LIMIT 30`,
    [workspaceId],
  );

  if (!row) {
    return {
      domain,
      domainRating: 0,
      openPageRank: null,
      referringCount: 0,
      discoveredAt: null,
      sources: [],
      stale: true,
    };
  }

  return {
    domain: row.domain,
    domainRating: row.domain_rating,
    openPageRank: row.open_pagerank,
    referringCount: row.referring_count,
    discoveredAt: row.discovered_at,
    sources: sourceRows.map(mapSource),
    stale: profileIsStale(row.discovered_at),
  };
}

export async function listNetworkPeers(
  workspaceId: string,
  businessType: string,
  competitors: string[],
): Promise<NetworkPeer[]> {
  const rows = await dbAll<NetworkRow>(
    `SELECT * FROM backlink_network
     WHERE opted_in = 1 AND workspace_id != ?
     ORDER BY updated_at DESC
     LIMIT 50`,
    [workspaceId],
  );

  const competitorHosts = new Set(
    competitors.map((c) =>
      c.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase(),
    ),
  );

  return rows
    .map((row) => {
      let matchScore = 1;
      const reasons: string[] = ["CitePilot network member"];

      if (
        businessType &&
        row.business_type &&
        row.business_type.toLowerCase() === businessType.toLowerCase()
      ) {
        matchScore += 4;
        reasons.push("same industry");
      }

      const host = row.domain.replace(/^www\./, "").toLowerCase();
      if (competitorHosts.has(host)) {
        matchScore += 3;
        reasons.push("tracked competitor");
      }

      return {
        workspaceId: row.workspace_id,
        domain: row.domain,
        businessType: row.business_type ?? "",
        optedIn: true,
        domainRating: null,
        matchScore,
        matchReason: reasons.join(" · "),
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 12);
}

async function enrichPeerRatings(peers: NetworkPeer[]): Promise<NetworkPeer[]> {
  if (peers.length === 0) return peers;
  const ids = peers.map((p) => p.workspaceId);
  const placeholders = ids.map(() => "?").join(",");
  const profiles = await dbAll<ProfileRow>(
    `SELECT workspace_id, domain_rating FROM backlink_profiles WHERE workspace_id IN (${placeholders})`,
    ids,
  );
  const ratingById = new Map(
    profiles.map((p) => [p.workspace_id, p.domain_rating]),
  );
  return peers.map((p) => ({
    ...p,
    domainRating: ratingById.get(p.workspaceId) ?? null,
  }));
}

function mapPlacement(
  row: PlacementRow,
  workspaceId: string,
  domainById: Map<string, string>,
): BacklinkPlacement {
  const isIncoming = row.partner_workspace_id === workspaceId;
  return {
    id: row.id,
    role: isIncoming ? "incoming" : "outgoing",
    requesterWorkspaceId: row.requester_workspace_id,
    requesterDomain: domainById.get(row.requester_workspace_id) ?? "unknown",
    partnerWorkspaceId: row.partner_workspace_id,
    partnerDomain: row.partner_workspace_id
      ? domainById.get(row.partner_workspace_id) ?? null
      : null,
    targetUrl: row.target_url,
    anchorText: row.anchor_text,
    contextNote: row.context_note,
    status: row.status as PlacementStatus,
    creditsCost: row.credits_cost,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listPlacements(
  workspaceId: string,
): Promise<BacklinkPlacement[]> {
  const rows = await dbAll<PlacementRow>(
    `SELECT * FROM backlink_placements
     WHERE requester_workspace_id = ? OR partner_workspace_id = ?
     ORDER BY created_at DESC
     LIMIT 50`,
    [workspaceId, workspaceId],
  );

  const ids = new Set<string>();
  for (const row of rows) {
    ids.add(row.requester_workspace_id);
    if (row.partner_workspace_id) ids.add(row.partner_workspace_id);
  }

  const domainById = new Map<string, string>();
  if (ids.size > 0) {
    const idList = [...ids];
    const placeholders = idList.map(() => "?").join(",");
    const networkRows = await dbAll<{ workspace_id: string; domain: string }>(
      `SELECT workspace_id, domain FROM backlink_network WHERE workspace_id IN (${placeholders})`,
      idList,
    );
    for (const n of networkRows) {
      domainById.set(n.workspace_id, n.domain);
    }
    const wsRows = await dbAll<{ id: string; domain: string }>(
      `SELECT id, domain FROM workspaces WHERE id IN (${placeholders})`,
      idList,
    );
    for (const w of wsRows) {
      if (!domainById.has(w.id)) domainById.set(w.id, w.domain);
    }
  }

  return rows.map((row) => mapPlacement(row, workspaceId, domainById));
}

export async function getBacklinkDashboard(input: {
  workspaceId: string;
  userId: string | null;
  domain: string;
  businessType: string;
  competitors: string[];
  autoRefresh?: boolean;
}): Promise<BacklinkDashboard> {
  const networkRow = await ensureNetworkRow({
    workspaceId: input.workspaceId,
    userId: input.userId,
    domain: input.domain,
    businessType: input.businessType,
  });

  let profile = await loadProfile(input.workspaceId, input.domain);
  if (
    input.autoRefresh !== false &&
    profile.stale &&
    (profile.sources.length === 0 || profile.discoveredAt === null)
  ) {
    try {
      profile = await refreshBacklinkProfile({
        workspaceId: input.workspaceId,
        domain: input.domain,
        competitors: input.competitors,
      });
    } catch (err) {
      console.error("Backlink profile refresh failed", err);
    }
  }

  const peers = await enrichPeerRatings(
    await listNetworkPeers(
      input.workspaceId,
      input.businessType,
      input.competitors,
    ),
  );

  const placements = await listPlacements(input.workspaceId);

  const { searchConfigured, openPageRankConfigured } = await import(
    "@/lib/backlinks/discover"
  );

  return {
    profile,
    network: mapNetworkState(networkRow),
    peers,
    placements,
    searchConfigured: searchConfigured(),
    openPageRankConfigured: openPageRankConfigured(),
  };
}

export async function createPlacementRequest(input: {
  workspaceId: string;
  userId: string | null;
  domain: string;
  businessType: string;
  competitors: string[];
  targetUrl: string;
  anchorText: string;
  contextNote?: string;
  preferredPartnerId?: string;
}): Promise<{ placement?: BacklinkPlacement; error?: string }> {
  const network = await ensureNetworkRow({
    workspaceId: input.workspaceId,
    userId: input.userId,
    domain: input.domain,
    businessType: input.businessType,
  });

  if (network.opted_in !== 1) {
    return { error: "Join the CitePilot network before requesting placements." };
  }

  const remaining = network.credits_total - network.credits_used;
  if (remaining < 1) {
    return { error: "No backlink credits remaining." };
  }

  let host: string;
  try {
    host = new URL(input.targetUrl).hostname.replace(/^www\./, "");
  } catch {
    return { error: "Enter a valid target URL." };
  }

  const cleanDomain = input.domain.replace(/^www\./, "");
  if (host !== cleanDomain && !host.endsWith(`.${cleanDomain}`)) {
    return {
      error: `Target URL must be on your domain (${input.domain}).`,
    };
  }

  const peers = await listNetworkPeers(
    input.workspaceId,
    input.businessType,
    input.competitors,
  );
  let partnerId: string | null = null;

  if (input.preferredPartnerId && input.preferredPartnerId !== input.workspaceId) {
    const preferred = peers.find((p) => p.workspaceId === input.preferredPartnerId);
    if (preferred) partnerId = preferred.workspaceId;
  }
  if (!partnerId && peers.length > 0) {
    partnerId = peers[0]!.workspaceId;
  }

  const now = new Date().toISOString();
  const id = uuidv4();
  const status: PlacementStatus = partnerId ? "pending_partner" : "queued";

  await dbRun(
    `INSERT INTO backlink_placements
     (id, requester_workspace_id, partner_workspace_id, target_url, anchor_text, context_note, status, credits_cost, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      id,
      input.workspaceId,
      partnerId,
      input.targetUrl,
      input.anchorText.trim(),
      input.contextNote?.trim() || null,
      status,
      now,
      now,
    ],
  );

  await dbRun(
    `UPDATE backlink_network SET credits_used = credits_used + 1, updated_at = ? WHERE workspace_id = ?`,
    [now, input.workspaceId],
  );

  const placements = await listPlacements(input.workspaceId);
  const placement = placements.find((p) => p.id === id);
  return { placement: placement! };
}

export async function updatePlacementStatus(input: {
  placementId: string;
  workspaceId: string;
  action: "accept" | "decline" | "mark_live" | "cancel";
}): Promise<{ placement: BacklinkPlacement | null; error?: string }> {
  const row = await dbGet<PlacementRow>(
    `SELECT * FROM backlink_placements WHERE id = ?`,
    [input.placementId],
  );
  if (!row) {
    return { placement: null, error: "Placement not found." };
  }

  const now = new Date().toISOString();
  let nextStatus: PlacementStatus | null = null;

  if (input.action === "accept") {
    if (row.partner_workspace_id !== input.workspaceId) {
      return { placement: null, error: "Only the matched partner can accept." };
    }
    if (row.status !== "pending_partner") {
      return { placement: null, error: "This request is no longer pending." };
    }
    nextStatus = "accepted";
  } else if (input.action === "decline") {
    if (row.partner_workspace_id !== input.workspaceId) {
      return { placement: null, error: "Only the matched partner can decline." };
    }
    if (row.status !== "pending_partner") {
      return { placement: null, error: "This request is no longer pending." };
    }
    nextStatus = "declined";
    await dbRun(
      `UPDATE backlink_network
       SET credits_used = CASE WHEN credits_used > ? THEN credits_used - ? ELSE 0 END,
           updated_at = ?
       WHERE workspace_id = ?`,
      [row.credits_cost, row.credits_cost, now, row.requester_workspace_id],
    );
  } else if (input.action === "mark_live") {
    if (row.requester_workspace_id !== input.workspaceId) {
      return { placement: null, error: "Only the requester can mark a placement live." };
    }
    if (row.status !== "accepted" && row.status !== "pending_partner") {
      return { placement: null, error: "Placement must be accepted before marking live." };
    }
    nextStatus = "live";
  } else if (input.action === "cancel") {
    if (row.requester_workspace_id !== input.workspaceId) {
      return { placement: null, error: "Only the requester can cancel." };
    }
    if (!["queued", "pending_partner"].includes(row.status)) {
      return { placement: null, error: "This placement can no longer be cancelled." };
    }
    nextStatus = "cancelled";
    await dbRun(
      `UPDATE backlink_network
       SET credits_used = CASE WHEN credits_used > ? THEN credits_used - ? ELSE 0 END,
           updated_at = ?
       WHERE workspace_id = ?`,
      [row.credits_cost, row.credits_cost, now, row.requester_workspace_id],
    );
  }

  if (!nextStatus) {
    return { placement: null, error: "Invalid action." };
  }

  await dbRun(
    `UPDATE backlink_placements SET status = ?, updated_at = ? WHERE id = ?`,
    [nextStatus, now, input.placementId],
  );

  const placements = await listPlacements(input.workspaceId);
  return { placement: placements.find((p) => p.id === input.placementId) ?? null };
}

export async function getBacklinkMetricsForWorkspace(
  workspaceId: string,
): Promise<{ domainRating: number; sourceCount: number } | null> {
  const row = await dbGet<ProfileRow>(
    `SELECT domain_rating, referring_count FROM backlink_profiles WHERE workspace_id = ?`,
    [workspaceId],
  );
  if (!row) return null;
  return {
    domainRating: row.domain_rating,
    sourceCount: row.referring_count,
  };
}
