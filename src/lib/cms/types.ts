export const CMS_PROVIDERS = [
  "wordpress",
  "ghost",
  "shopify",
  "framer",
] as const;

export type CmsProvider = (typeof CMS_PROVIDERS)[number];

export type WordPressCredentials = {
  siteUrl: string;
  username: string;
  appPassword: string;
};

export type GhostCredentials = {
  siteUrl: string;
  adminApiKey: string;
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

export type CmsCredentialsByProvider = {
  wordpress: WordPressCredentials;
  ghost: GhostCredentials;
  shopify: ShopifyCredentials;
  framer: FramerCredentials;
};

export type CmsRemoteDefaultsByProvider = {
  wordpress: Record<string, never>;
  ghost: Record<string, never>;
  shopify: {
    blogId: string;
    blogTitle: string;
    blogHandle: string;
  };
  framer: {
    collectionName: string;
  };
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
};
