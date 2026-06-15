import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

const globalForDb = globalThis as unknown as { citepilotDb?: Database.Database };

function dbPath(): string {
  const testPath = process.env.CITEPILOT_TEST_DB_PATH?.trim();
  if (testPath) return testPath;

  const dir = path.join(process.cwd(), ".data");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, "citepilot.db");
}

function initSchema(db: Database.Database): void {
  db.exec(`
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
      workspace_id TEXT,
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
      created_at TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    CREATE TABLE IF NOT EXISTS platform_citation_checks (
      id TEXT PRIMARY KEY,
      audit_id TEXT NOT NULL,
      workspace_id TEXT,
      platform TEXT NOT NULL,
      prompt_index INTEGER NOT NULL,
      prompt TEXT NOT NULL,
      cited INTEGER NOT NULL,
      check_mode TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (audit_id) REFERENCES audit_runs(id),
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    CREATE INDEX IF NOT EXISTS idx_platform_checks_audit ON platform_citation_checks(audit_id);
    CREATE INDEX IF NOT EXISTS idx_platform_checks_workspace ON platform_citation_checks(workspace_id);

    CREATE TABLE IF NOT EXISTS cron_dispatch_log (
      id TEXT PRIMARY KEY,
      job_name TEXT NOT NULL,
      workspace_id TEXT,
      period_key TEXT NOT NULL,
      status TEXT NOT NULL,
      error TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    CREATE INDEX IF NOT EXISTS idx_cron_dispatch_job_period ON cron_dispatch_log(job_name, period_key);
    CREATE INDEX IF NOT EXISTS idx_cron_dispatch_workspace ON cron_dispatch_log(workspace_id);

    CREATE TABLE IF NOT EXISTS citation_snapshots (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      visibility_index INTEGER NOT NULL,
      recorded_at TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    CREATE TABLE IF NOT EXISTS workspace_content_strategies (
      workspace_id TEXT PRIMARY KEY,
      audit_id TEXT,
      items TEXT NOT NULL,
      generated_at TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    CREATE TABLE IF NOT EXISTS fleet_api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
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

    CREATE INDEX IF NOT EXISTS idx_audit_workspace ON audit_runs(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_runs(created_at);
    CREATE INDEX IF NOT EXISTS idx_snapshots_workspace ON citation_snapshots(workspace_id);

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
      workspace_id TEXT,
      created_at TEXT NOT NULL,
      webflow_item_id TEXT,
      webflow_published_at TEXT,
      webflow_live_url TEXT,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

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
      workspace_id TEXT PRIMARY KEY,
      domain TEXT NOT NULL,
      domain_rating INTEGER NOT NULL DEFAULT 0,
      open_pagerank REAL,
      referring_count INTEGER NOT NULL DEFAULT 0,
      discovered_at TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    CREATE TABLE IF NOT EXISTS backlink_sources (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      url TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      source_domain TEXT NOT NULL,
      discovery_source TEXT NOT NULL,
      discovered_at TEXT NOT NULL,
      UNIQUE(workspace_id, url),
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    CREATE INDEX IF NOT EXISTS idx_backlink_sources_workspace ON backlink_sources(workspace_id);

    CREATE TABLE IF NOT EXISTS backlink_network (
      workspace_id TEXT PRIMARY KEY,
      user_id TEXT,
      domain TEXT NOT NULL,
      business_type TEXT,
      credits_total INTEGER NOT NULL DEFAULT 100,
      credits_used INTEGER NOT NULL DEFAULT 0,
      opted_in INTEGER NOT NULL DEFAULT 0,
      opted_in_at TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    CREATE INDEX IF NOT EXISTS idx_backlink_network_opted ON backlink_network(opted_in);

    CREATE TABLE IF NOT EXISTS backlink_placements (
      id TEXT PRIMARY KEY,
      requester_workspace_id TEXT NOT NULL,
      partner_workspace_id TEXT,
      target_url TEXT NOT NULL,
      anchor_text TEXT NOT NULL,
      context_note TEXT,
      status TEXT NOT NULL,
      credits_cost INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (requester_workspace_id) REFERENCES workspaces(id),
      FOREIGN KEY (partner_workspace_id) REFERENCES workspaces(id)
    );

    CREATE INDEX IF NOT EXISTS idx_backlink_placements_requester ON backlink_placements(requester_workspace_id);
    CREATE INDEX IF NOT EXISTS idx_backlink_placements_partner ON backlink_placements(partner_workspace_id);

    CREATE TABLE IF NOT EXISTS cms_connections (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      display_name TEXT NOT NULL,
      site_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'connected',
      credentials_encrypted TEXT NOT NULL,
      remote_defaults TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(workspace_id, provider),
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    CREATE INDEX IF NOT EXISTS idx_cms_connections_workspace ON cms_connections(workspace_id);

    CREATE TABLE IF NOT EXISTS cms_publications (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      post_slug TEXT NOT NULL,
      remote_id TEXT NOT NULL,
      remote_url TEXT,
      published_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(workspace_id, provider, post_slug),
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    CREATE INDEX IF NOT EXISTS idx_cms_publications_workspace ON cms_publications(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_cms_publications_slug ON cms_publications(post_slug);
  `);
}

function migrateSchema(db: Database.Database): void {
  const columns = db
    .prepare(`PRAGMA table_info(workspaces)`)
    .all() as { name: string }[];
  if (!columns.some((c) => c.name === "preferences")) {
    db.exec(
      `ALTER TABLE workspaces ADD COLUMN preferences TEXT NOT NULL DEFAULT '{}'`,
    );
  }
  if (!columns.some((c) => c.name === "user_id")) {
    db.exec(`ALTER TABLE workspaces ADD COLUMN user_id TEXT`);
  }

  const blogCols = db
    .prepare(`PRAGMA table_info(blog_posts)`)
    .all() as { name: string }[];
  if (!blogCols.some((c) => c.name === "webflow_item_id")) {
    db.exec(`ALTER TABLE blog_posts ADD COLUMN webflow_item_id TEXT`);
  }
  if (!blogCols.some((c) => c.name === "webflow_published_at")) {
    db.exec(`ALTER TABLE blog_posts ADD COLUMN webflow_published_at TEXT`);
  }
  if (!blogCols.some((c) => c.name === "webflow_live_url")) {
    db.exec(`ALTER TABLE blog_posts ADD COLUMN webflow_live_url TEXT`);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS backlink_profiles (
      workspace_id TEXT PRIMARY KEY,
      domain TEXT NOT NULL,
      domain_rating INTEGER NOT NULL DEFAULT 0,
      open_pagerank REAL,
      referring_count INTEGER NOT NULL DEFAULT 0,
      discovered_at TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    CREATE TABLE IF NOT EXISTS backlink_sources (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      url TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      source_domain TEXT NOT NULL,
      discovery_source TEXT NOT NULL,
      discovered_at TEXT NOT NULL,
      UNIQUE(workspace_id, url),
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    CREATE INDEX IF NOT EXISTS idx_backlink_sources_workspace ON backlink_sources(workspace_id);

    CREATE TABLE IF NOT EXISTS backlink_network (
      workspace_id TEXT PRIMARY KEY,
      user_id TEXT,
      domain TEXT NOT NULL,
      business_type TEXT,
      credits_total INTEGER NOT NULL DEFAULT 100,
      credits_used INTEGER NOT NULL DEFAULT 0,
      opted_in INTEGER NOT NULL DEFAULT 0,
      opted_in_at TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    CREATE INDEX IF NOT EXISTS idx_backlink_network_opted ON backlink_network(opted_in);

    CREATE TABLE IF NOT EXISTS backlink_placements (
      id TEXT PRIMARY KEY,
      requester_workspace_id TEXT NOT NULL,
      partner_workspace_id TEXT,
      target_url TEXT NOT NULL,
      anchor_text TEXT NOT NULL,
      context_note TEXT,
      status TEXT NOT NULL,
      credits_cost INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (requester_workspace_id) REFERENCES workspaces(id),
      FOREIGN KEY (partner_workspace_id) REFERENCES workspaces(id)
    );

    CREATE INDEX IF NOT EXISTS idx_backlink_placements_requester ON backlink_placements(requester_workspace_id);
    CREATE INDEX IF NOT EXISTS idx_backlink_placements_partner ON backlink_placements(partner_workspace_id);

    CREATE TABLE IF NOT EXISTS audit_shares (
      token TEXT PRIMARY KEY,
      audit_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT,
      FOREIGN KEY (audit_id) REFERENCES audit_runs(id),
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    CREATE INDEX IF NOT EXISTS idx_audit_shares_workspace ON audit_shares(workspace_id);

    CREATE TABLE IF NOT EXISTS workspace_content_strategies (
      workspace_id TEXT PRIMARY KEY,
      audit_id TEXT,
      items TEXT NOT NULL,
      generated_at TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    CREATE TABLE IF NOT EXISTS fleet_api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
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

    CREATE TABLE IF NOT EXISTS gsc_connections (
      workspace_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      site_url TEXT NOT NULL,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      expires_at TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    CREATE TABLE IF NOT EXISTS cms_connections (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      display_name TEXT NOT NULL,
      site_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'connected',
      credentials_encrypted TEXT NOT NULL,
      remote_defaults TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(workspace_id, provider),
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    CREATE INDEX IF NOT EXISTS idx_cms_connections_workspace ON cms_connections(workspace_id);

    CREATE TABLE IF NOT EXISTS cms_publications (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      post_slug TEXT NOT NULL,
      remote_id TEXT NOT NULL,
      remote_url TEXT,
      published_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(workspace_id, provider, post_slug),
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    CREATE INDEX IF NOT EXISTS idx_cms_publications_workspace ON cms_publications(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_cms_publications_slug ON cms_publications(post_slug);

    CREATE TABLE IF NOT EXISTS platform_citation_checks (
      id TEXT PRIMARY KEY,
      audit_id TEXT NOT NULL,
      workspace_id TEXT,
      platform TEXT NOT NULL,
      prompt_index INTEGER NOT NULL,
      prompt TEXT NOT NULL,
      cited INTEGER NOT NULL,
      check_mode TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (audit_id) REFERENCES audit_runs(id),
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    CREATE INDEX IF NOT EXISTS idx_platform_checks_audit ON platform_citation_checks(audit_id);
    CREATE INDEX IF NOT EXISTS idx_platform_checks_workspace ON platform_citation_checks(workspace_id);

    CREATE TABLE IF NOT EXISTS cron_dispatch_log (
      id TEXT PRIMARY KEY,
      job_name TEXT NOT NULL,
      workspace_id TEXT,
      period_key TEXT NOT NULL,
      status TEXT NOT NULL,
      error TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    CREATE INDEX IF NOT EXISTS idx_cron_dispatch_job_period ON cron_dispatch_log(job_name, period_key);
    CREATE INDEX IF NOT EXISTS idx_cron_dispatch_workspace ON cron_dispatch_log(workspace_id);

    CREATE TABLE IF NOT EXISTS user_onboarding (
      user_id TEXT PRIMARY KEY,
      dismissed_at TEXT,
      shared_proof INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  const auditCols = db
    .prepare(`PRAGMA table_info(audit_runs)`)
    .all() as { name: string }[];
  if (!auditCols.some((c) => c.name === "trigger")) {
    db.exec(
      `ALTER TABLE audit_runs ADD COLUMN trigger TEXT NOT NULL DEFAULT 'manual'`,
    );
  }
}

export function getDb(): Database.Database {
  if (!globalForDb.citepilotDb) {
    globalForDb.citepilotDb = new Database(dbPath());
    globalForDb.citepilotDb.pragma("journal_mode = WAL");
    initSchema(globalForDb.citepilotDb);
    migrateSchema(globalForDb.citepilotDb);
  }
  return globalForDb.citepilotDb;
}
