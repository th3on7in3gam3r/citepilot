/** Postgres DDL — mirrors SQLite schema in src/lib/db/index.ts */
export const POSTGRES_INIT_SQL = `
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  domain TEXT NOT NULL,
  business_type TEXT,
  description TEXT,
  audiences TEXT NOT NULL DEFAULT '[]',
  competitors TEXT NOT NULL DEFAULT '[]',
  buyer_question TEXT,
  referral TEXT,
  preferences TEXT NOT NULL DEFAULT '{}',
  user_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_runs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id),
  domain TEXT NOT NULL,
  prompts TEXT NOT NULL,
  score INTEGER NOT NULL,
  cited_count INTEGER NOT NULL,
  total_prompts INTEGER NOT NULL,
  platforms TEXT NOT NULL,
  gaps TEXT NOT NULL,
  site_signals TEXT NOT NULL,
  prompt_results TEXT NOT NULL,
  mode TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS citation_snapshots (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  visibility_index INTEGER NOT NULL,
  recorded_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS waitlist (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  pillar TEXT NOT NULL,
  audience TEXT NOT NULL,
  content_type TEXT NOT NULL,
  published_at TEXT NOT NULL,
  seo_title TEXT NOT NULL,
  tldr TEXT NOT NULL DEFAULT '',
  markdown TEXT NOT NULL,
  reading_minutes INTEGER NOT NULL,
  workspace_id TEXT REFERENCES workspaces(id),
  created_at TEXT NOT NULL,
  webflow_item_id TEXT,
  webflow_published_at TEXT,
  webflow_live_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_workspace ON audit_runs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_runs(created_at);
CREATE INDEX IF NOT EXISTS idx_snapshots_workspace ON citation_snapshots(workspace_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published_at);

CREATE TABLE IF NOT EXISTS billing_accounts (
  user_id TEXT PRIMARY KEY,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'inactive',
  current_period_end TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS backlink_profiles (
  workspace_id TEXT PRIMARY KEY REFERENCES workspaces(id),
  domain TEXT NOT NULL,
  domain_rating INTEGER NOT NULL DEFAULT 0,
  open_pagerank REAL,
  referring_count INTEGER NOT NULL DEFAULT 0,
  discovered_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS backlink_sources (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  url TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  source_domain TEXT NOT NULL,
  discovery_source TEXT NOT NULL,
  discovered_at TEXT NOT NULL,
  UNIQUE(workspace_id, url)
);

CREATE INDEX IF NOT EXISTS idx_backlink_sources_workspace ON backlink_sources(workspace_id);

CREATE TABLE IF NOT EXISTS backlink_network (
  workspace_id TEXT PRIMARY KEY REFERENCES workspaces(id),
  user_id TEXT,
  domain TEXT NOT NULL,
  business_type TEXT,
  credits_total INTEGER NOT NULL DEFAULT 100,
  credits_used INTEGER NOT NULL DEFAULT 0,
  opted_in INTEGER NOT NULL DEFAULT 0,
  opted_in_at TEXT,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_backlink_network_opted ON backlink_network(opted_in);

CREATE TABLE IF NOT EXISTS backlink_placements (
  id TEXT PRIMARY KEY,
  requester_workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  partner_workspace_id TEXT REFERENCES workspaces(id),
  target_url TEXT NOT NULL,
  anchor_text TEXT NOT NULL,
  context_note TEXT,
  status TEXT NOT NULL,
  credits_cost INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_backlink_placements_requester ON backlink_placements(requester_workspace_id);
CREATE INDEX IF NOT EXISTS idx_backlink_placements_partner ON backlink_placements(partner_workspace_id);

CREATE TABLE IF NOT EXISTS audit_shares (
  token TEXT PRIMARY KEY,
  audit_id TEXT NOT NULL REFERENCES audit_runs(id),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  created_at TEXT NOT NULL,
  expires_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_shares_workspace ON audit_shares(workspace_id);

CREATE TABLE IF NOT EXISTS gsc_connections (
  workspace_id TEXT PRIMARY KEY REFERENCES workspaces(id),
  user_id TEXT NOT NULL,
  site_url TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TEXT,
  updated_at TEXT NOT NULL
);
`;
