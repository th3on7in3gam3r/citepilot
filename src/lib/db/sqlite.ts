import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

const globalForDb = globalThis as unknown as { citepilotDb?: Database.Database };

function dbPath(): string {
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
      created_at TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    CREATE TABLE IF NOT EXISTS citation_snapshots (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      visibility_index INTEGER NOT NULL,
      recorded_at TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
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
