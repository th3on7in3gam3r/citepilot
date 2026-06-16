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
  display_name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  archived_at TEXT,
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
  trigger TEXT NOT NULL DEFAULT 'manual',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS platform_citation_checks (
  id TEXT PRIMARY KEY,
  audit_id TEXT NOT NULL REFERENCES audit_runs(id),
  workspace_id TEXT REFERENCES workspaces(id),
  platform TEXT NOT NULL,
  prompt_index INTEGER NOT NULL,
  prompt TEXT NOT NULL,
  cited INTEGER NOT NULL,
  check_mode TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_platform_checks_audit ON platform_citation_checks(audit_id);
CREATE INDEX IF NOT EXISTS idx_platform_checks_workspace ON platform_citation_checks(workspace_id);

CREATE TABLE IF NOT EXISTS citation_snapshots (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  visibility_index INTEGER NOT NULL,
  recorded_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspace_content_strategies (
  workspace_id TEXT PRIMARY KEY REFERENCES workspaces(id),
  audit_id TEXT,
  items TEXT NOT NULL,
  generated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fleet_api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  last_used_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_fleet_api_keys_user ON fleet_api_keys(user_id);

CREATE TABLE IF NOT EXISTS fleet_api_usage (
  subject TEXT NOT NULL,
  window_key TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (subject, window_key)
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
  webflow_live_url TEXT,
  cover_image_url TEXT,
  cover_image_alt TEXT
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
  expires_at TEXT,
  password_hash TEXT
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

CREATE TABLE IF NOT EXISTS cms_connections (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  provider TEXT NOT NULL,
  display_name TEXT NOT NULL,
  site_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'connected',
  credentials_encrypted TEXT NOT NULL,
  remote_defaults TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(workspace_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_cms_connections_workspace ON cms_connections(workspace_id);

CREATE TABLE IF NOT EXISTS cms_publications (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  provider TEXT NOT NULL,
  post_slug TEXT NOT NULL,
  remote_id TEXT NOT NULL,
  remote_url TEXT,
  published_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(workspace_id, provider, post_slug)
);

CREATE INDEX IF NOT EXISTS idx_cms_publications_workspace ON cms_publications(workspace_id);

ALTER TABLE audit_runs ADD COLUMN IF NOT EXISTS trigger TEXT NOT NULL DEFAULT 'manual';

CREATE TABLE IF NOT EXISTS cron_dispatch_log (
  id TEXT PRIMARY KEY,
  job_name TEXT NOT NULL,
  workspace_id TEXT REFERENCES workspaces(id),
  period_key TEXT NOT NULL,
  status TEXT NOT NULL,
  error TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cron_dispatch_job_period ON cron_dispatch_log(job_name, period_key);
CREATE INDEX IF NOT EXISTS idx_cron_dispatch_workspace ON cron_dispatch_log(workspace_id);

CREATE INDEX IF NOT EXISTS idx_cms_publications_slug ON cms_publications(post_slug);

CREATE TABLE IF NOT EXISTS user_onboarding (
  user_id TEXT PRIMARY KEY,
  dismissed_at TEXT,
  shared_proof INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_referrals (
  user_id TEXT PRIMARY KEY,
  referral_code TEXT NOT NULL UNIQUE,
  referred_by TEXT,
  referral_count INTEGER NOT NULL DEFAULT 0,
  credits_earned INTEGER NOT NULL DEFAULT 0,
  credits_applied INTEGER NOT NULL DEFAULT 0,
  link_clicks INTEGER NOT NULL DEFAULT 0,
  email TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_referrals_code ON user_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referred_by ON user_referrals(referred_by);

CREATE TABLE IF NOT EXISTS referral_attributions (
  referred_user_id TEXT PRIMARY KEY,
  referrer_user_id TEXT NOT NULL,
  signed_up_at TEXT NOT NULL,
  converted_at TEXT,
  credit_applied_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_referral_attributions_referrer ON referral_attributions(referrer_user_id);

CREATE TABLE IF NOT EXISTS email_unsubscribes (
  user_id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  unsubscribed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS email_sent (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  sequence_name TEXT NOT NULL,
  email_number INTEGER NOT NULL,
  resend_id TEXT,
  sent_at TEXT NOT NULL,
  opened_at TEXT,
  clicked_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_sent_dedup ON email_sent(user_id, sequence_name, email_number);
CREATE INDEX IF NOT EXISTS idx_email_sent_resend ON email_sent(resend_id);

CREATE TABLE IF NOT EXISTS email_sequence_queue (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  sequence_name TEXT NOT NULL,
  email_number INTEGER NOT NULL,
  scheduled_at TEXT NOT NULL,
  payload TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_queue_due ON email_sequence_queue(status, scheduled_at);

CREATE TABLE IF NOT EXISTS slack_connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL UNIQUE,
  slack_team_id TEXT NOT NULL,
  slack_team_name TEXT,
  slack_channel_id TEXT,
  slack_channel_name TEXT,
  encrypted_token TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

CREATE INDEX IF NOT EXISTS idx_slack_connections_user ON slack_connections(user_id);

CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  url TEXT NOT NULL,
  encrypted_secret TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_workspace ON webhook_endpoints(workspace_id);

CREATE TABLE IF NOT EXISTS alert_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  prompt TEXT,
  platform TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

CREATE INDEX IF NOT EXISTS idx_alert_events_workspace ON alert_events(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_events_user ON alert_events(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS white_label_logos (
  workspace_id TEXT PRIMARY KEY REFERENCES workspaces(id),
  mime_type TEXT NOT NULL,
  data_base64 TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS white_label_domains (
  domain TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  user_id TEXT NOT NULL,
  verified_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_white_label_domains_workspace ON white_label_domains(workspace_id);

CREATE TABLE IF NOT EXISTS feature_requests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  submitted_by TEXT,
  submitter_email TEXT,
  vote_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'under_review',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feature_requests_status ON feature_requests(status);
CREATE INDEX IF NOT EXISTS idx_feature_requests_votes ON feature_requests(vote_count DESC);

CREATE TABLE IF NOT EXISTS feature_request_votes (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(request_id, user_id),
  FOREIGN KEY (request_id) REFERENCES feature_requests(id)
);

CREATE INDEX IF NOT EXISTS idx_feature_votes_user ON feature_request_votes(user_id);

CREATE TABLE IF NOT EXISTS audit_feedback (
  id TEXT PRIMARY KEY,
  audit_id TEXT,
  workspace_id TEXT,
  user_id TEXT,
  domain TEXT NOT NULL,
  score INTEGER,
  useful INTEGER NOT NULL,
  comment TEXT,
  source TEXT NOT NULL DEFAULT 'dashboard',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_feedback_audit ON audit_feedback(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_feedback_domain ON audit_feedback(domain);

CREATE TABLE IF NOT EXISTS cancel_survey_responses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  competitor TEXT,
  missing_feature TEXT,
  details TEXT,
  plan TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cancel_survey_user ON cancel_survey_responses(user_id);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL UNIQUE,
  email_weekly_digest BOOLEAN NOT NULL DEFAULT TRUE,
  digest_day INTEGER NOT NULL DEFAULT 1,
  digest_hour INTEGER NOT NULL DEFAULT 9,
  digest_timezone TEXT NOT NULL DEFAULT 'UTC',
  email_drop_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  drop_threshold INTEGER NOT NULL DEFAULT 10,
  email_competitor_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  slack_weekly BOOLEAN NOT NULL DEFAULT TRUE,
  slack_drop_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  webhook_events TEXT NOT NULL DEFAULT '["audit.completed","citation.change_detected"]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_workspace ON notification_preferences(workspace_id);

CREATE TABLE IF NOT EXISTS workspace_members (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  email TEXT NOT NULL,
  user_id TEXT,
  role TEXT NOT NULL DEFAULT 'viewer',
  invited_by TEXT NOT NULL,
  invited_at TEXT NOT NULL,
  accepted_at TEXT,
  UNIQUE(workspace_id, email)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
`;
