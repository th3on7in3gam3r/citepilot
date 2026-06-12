export type BacklinkSource = {
  id: string;
  url: string;
  title: string;
  sourceDomain: string;
  discoverySource: "serper" | "serpapi" | "tavily" | "competitor";
};

export type NetworkPeer = {
  workspaceId: string;
  domain: string;
  businessType: string;
  optedIn: boolean;
  domainRating: number | null;
  matchScore: number;
  matchReason: string;
};

export type BacklinkPlacement = {
  id: string;
  role: "outgoing" | "incoming";
  requesterWorkspaceId: string;
  requesterDomain: string;
  partnerWorkspaceId: string | null;
  partnerDomain: string | null;
  targetUrl: string;
  anchorText: string;
  contextNote: string | null;
  status: PlacementStatus;
  creditsCost: number;
  createdAt: string;
  updatedAt: string;
};

export type PlacementStatus =
  | "queued"
  | "pending_partner"
  | "accepted"
  | "live"
  | "declined"
  | "cancelled";

export type BacklinkProfile = {
  domain: string;
  domainRating: number;
  openPageRank: number | null;
  referringCount: number;
  discoveredAt: string | null;
  sources: BacklinkSource[];
  stale: boolean;
};

export type BacklinkNetworkState = {
  optedIn: boolean;
  optedInAt: string | null;
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
};

export type BacklinkDashboard = {
  profile: BacklinkProfile;
  network: BacklinkNetworkState;
  peers: NetworkPeer[];
  placements: BacklinkPlacement[];
  searchConfigured: boolean;
  openPageRankConfigured: boolean;
};
