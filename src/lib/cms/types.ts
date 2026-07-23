export const CMS_PROVIDERS = [
  "webflow",
  "wordpress",
  "ghost",
  "hashnode",
  "shopify",
  "framer",
  "signaldesk",
] as const;

export type CmsProvider = (typeof CMS_PROVIDERS)[number];

export type WebflowCredentials = {
  apiKey: string;
  siteId: string;
  collectionId: string;
};

export type WordPressCredentials = {
  siteUrl: string;
  username: string;
  appPassword: string;
};

export type GhostCredentials = {
  siteUrl: string;
  adminApiKey: string;
};

export type HashnodeCredentials = {
  accessToken: string;
  publicationId: string;
};

export type ShopifyCredentials = {
  shopDomain: string;
  accessToken: string;
};

export type FramerCredentials = {
  projectUrl: string;
  apiKey: string;
  collectionId: string;
  titleFieldId: string;
  bodyFieldId: string;
  summaryFieldId?: string;
};

/** Signal Desk — WordPress-compatible GEO newsroom ingest. */
export type SignalDeskCredentials = {
  siteUrl: string;
  username: string;
  appPassword: string;
};

export type CmsCredentialsByProvider = {
  webflow: WebflowCredentials;
  wordpress: WordPressCredentials;
  ghost: GhostCredentials;
  hashnode: HashnodeCredentials;
  shopify: ShopifyCredentials;
  framer: FramerCredentials;
  signaldesk: SignalDeskCredentials;
};

export type CmsRemoteDefaultsByProvider = {
  webflow: {
    siteName: string;
    collectionName: string;
    sitePreviewUrl?: string;
    fieldName?: string;
    fieldSlug?: string;
    fieldBody?: string;
    maskedApiKey?: string;
  };
  wordpress: { maskedAppPassword?: string };
  ghost: { maskedAdminApiKey?: string };
  hashnode: { maskedAccessToken?: string };
  shopify: {
    blogId: string;
    blogTitle: string;
    blogHandle: string;
    shopName?: string;
    maskedAccessToken?: string;
  };
  framer: {
    collectionName: string;
    snippetInstalled?: boolean;
    maskedApiKey?: string;
  };
  signaldesk: { maskedAppPassword?: string };
};

export type CmsConnectionRow = {
  id: string;
  workspace_id: string;
  provider: string;
  display_name: string;
  site_url: string;
  status: string;
  credentials_encrypted: string;
  remote_defaults: string | null;
  created_at: string;
  updated_at: string;
};

export type CmsPublicationRow = {
  id: string;
  workspace_id: string;
  provider: string;
  post_slug: string;
  remote_id: string;
  remote_url: string | null;
  published_at: string;
  updated_at: string;
};

export type CmsConnection<P extends CmsProvider = CmsProvider> = {
  id: string;
  workspaceId: string;
  provider: P;
  displayName: string;
  siteUrl: string;
  status: string;
  credentials: CmsCredentialsByProvider[P];
  remoteDefaults: CmsRemoteDefaultsByProvider[P];
  createdAt: string;
  updatedAt: string;
};

export type CmsPublication<P extends CmsProvider = CmsProvider> = {
  id: string;
  workspaceId: string;
  provider: P;
  postSlug: string;
  remoteId: string;
  remoteUrl: string | null;
  publishedAt: string;
  updatedAt: string;
};

export type CmsConnectionSummary = {
  provider: CmsProvider;
  configured: boolean;
  connected: boolean;
  displayName?: string;
  siteUrl?: string;
  detail?: string;
  status?: "connected" | "error" | "disconnected";
  maskedSecret?: string;
  lastPublishTitle?: string;
  lastPublishAt?: string;
};
