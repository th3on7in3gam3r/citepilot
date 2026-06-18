import { Pool } from "@neondatabase/serverless";
import { POSTGRES_INIT_SQL } from "@/lib/db/postgres-schema";
import { getDb } from "@/lib/db/sqlite";

const globalForPg = globalThis as unknown as {
  citepilotPool?: Pool;
  citepilotPgReady?: Promise<void>;
};

/**
 * Neon / Postgres URL for runtime queries.
 * Prefer DATABASE_URL_POOLED (PgBouncer) to reduce serverless cold-start latency.
 * Use DATABASE_URL_DIRECT for migrations and one-off admin scripts.
 */
export function postgresConnectionString(): string | undefined {
  const pooled = process.env.DATABASE_URL_POOLED?.trim();
  if (pooled) return pooled;

  const direct =
    process.env.DATABASE_URL?.trim() || process.env.NEON_URL?.trim();
  if (!direct) return undefined;

  return preferNeonPooler(direct);
}

/** Upgrade a direct Neon host to the -pooler endpoint when pooling env is unset. */
function preferNeonPooler(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    if (!host.includes(".neon.tech") || host.includes("-pooler.")) {
      return url;
    }
    parsed.hostname = host.replace(
      /^ep-([^.]+)\./,
      "ep-$1-pooler.",
    );
    if (!parsed.searchParams.has("pgbouncer")) {
      parsed.searchParams.set("pgbouncer", "true");
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

/** Direct (non-pooled) URL for migrations and DDL. */
export function postgresDirectConnectionString(): string | undefined {
  return (
    process.env.DATABASE_URL_DIRECT?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    process.env.NEON_URL?.trim() ||
    undefined
  );
}

export function postgresEnvVar(): "DATABASE_URL" | "NEON_URL" | null {
  if (process.env.DATABASE_URL?.trim()) return "DATABASE_URL";
  if (process.env.NEON_URL?.trim()) return "NEON_URL";
  return null;
}

export function isPostgres(): boolean {
  return Boolean(postgresConnectionString());
}

function getPool(): Pool {
  const connectionString = postgresConnectionString();
  if (!connectionString) {
    throw new Error("DATABASE_URL or NEON_URL is required for Postgres");
  }
  if (!globalForPg.citepilotPool) {
    globalForPg.citepilotPool = new Pool({ connectionString });
  }
  return globalForPg.citepilotPool;
}

function toPgPlaceholders(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

async function ensurePostgres(): Promise<void> {
  if (!globalForPg.citepilotPgReady) {
    globalForPg.citepilotPgReady = (async () => {
      const pool = getPool();
      const statements = POSTGRES_INIT_SQL.split(";")
        .map((s) => s.trim())
        .filter(Boolean);
      for (const statement of statements) {
        await pool.query(statement);
      }
      await pool.query(
        `ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS user_id TEXT`,
      );
      await pool.query(
        `ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS webflow_item_id TEXT`,
      );
      await pool.query(
        `ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS webflow_published_at TEXT`,
      );
      await pool.query(
        `ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS webflow_live_url TEXT`,
      );
      await pool.query(
        `ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS cover_image_url TEXT`,
      );
      await pool.query(
        `ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS cover_image_alt TEXT`,
      );
      await pool.query(
        `ALTER TABLE fleet_api_keys ADD COLUMN IF NOT EXISTS workspace_id TEXT`,
      );
      await pool.query(
        `ALTER TABLE audit_shares ADD COLUMN IF NOT EXISTS password_hash TEXT`,
      );
      await pool.query(
        `ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS display_name TEXT`,
      );
      await pool.query(
        `ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'`,
      );
      await pool.query(
        `ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS archived_at TEXT`,
      );
      await pool.query(`
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
        )
      `);
      await pool.query(
        `CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id)`,
      );
      await pool.query(
        `CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id)`,
      );
      await pool.query(
        `ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS token TEXT`,
      );
      await pool.query(
        `ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'`,
      );
      await pool.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_members_token ON workspace_members(token) WHERE token IS NOT NULL`,
      );
      await pool.query(
        `UPDATE workspace_members SET status = 'accepted' WHERE accepted_at IS NOT NULL AND status = 'pending'`,
      );
      await pool.query(
        `ALTER TABLE user_onboarding ADD COLUMN IF NOT EXISTS onboarding_completed_at TEXT`,
      );
      await pool.query(
        `ALTER TABLE user_onboarding ADD COLUMN IF NOT EXISTS signup_source TEXT`,
      );
      await pool.query(
        `ALTER TABLE user_onboarding ADD COLUMN IF NOT EXISTS signup_campaign TEXT`,
      );
      await pool.query(
        `ALTER TABLE user_onboarding ADD COLUMN IF NOT EXISTS signup_medium TEXT`,
      );
      await pool.query(`
        CREATE TABLE IF NOT EXISTS admin_audit_log (
          id TEXT PRIMARY KEY,
          admin_id TEXT NOT NULL,
          admin_email TEXT NOT NULL,
          action TEXT NOT NULL,
          target_user_id TEXT,
          metadata TEXT NOT NULL DEFAULT '{}',
          created_at TEXT NOT NULL
        )
      `);
      await pool.query(
        `CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created ON admin_audit_log(created_at DESC)`,
      );
      await pool.query(`
        CREATE TABLE IF NOT EXISTS domain_score_profiles (
          domain TEXT PRIMARY KEY,
          is_public INTEGER NOT NULL DEFAULT 1,
          claimed_by_user_id TEXT,
          claimed_at TEXT,
          verified_at TEXT,
          verification_token TEXT,
          updated_at TEXT NOT NULL
        )
      `);
      await pool.query(
        `CREATE INDEX IF NOT EXISTS idx_domain_score_profiles_public ON domain_score_profiles(is_public)`,
      );
      await pool.query(
        `CREATE INDEX IF NOT EXISTS idx_audit_domain ON audit_runs(domain)`,
      );
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_totp (
          user_id TEXT PRIMARY KEY,
          totp_secret TEXT,
          pending_secret TEXT,
          totp_enabled INTEGER NOT NULL DEFAULT 0,
          totp_backup_codes TEXT NOT NULL DEFAULT '[]',
          totp_enabled_at TEXT,
          failed_attempts INTEGER NOT NULL DEFAULT 0,
          locked_until TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_accounts (
          user_id TEXT PRIMARY KEY,
          email TEXT,
          deletion_status TEXT NOT NULL DEFAULT 'active',
          deleted_at TEXT,
          deletion_requested_at TEXT,
          cancellation_token TEXT,
          cancellation_token_expires_at TEXT,
          stripe_customer_id TEXT,
          stripe_subscription_id TEXT,
          previous_plan TEXT,
          previous_billing_status TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);
      await pool.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_user_accounts_cancellation_token ON user_accounts(cancellation_token) WHERE cancellation_token IS NOT NULL`,
      );
      await pool.query(`
        CREATE TABLE IF NOT EXISTS account_export_jobs (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'processing',
          export_data TEXT,
          error_message TEXT,
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL,
          completed_at TEXT
        )
      `);
      await pool.query(
        `CREATE INDEX IF NOT EXISTS idx_account_export_jobs_user ON account_export_jobs(user_id, created_at DESC)`,
      );
      await pool.query(`
        CREATE TABLE IF NOT EXISTS compliance_log (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          action TEXT NOT NULL,
          metadata TEXT NOT NULL DEFAULT '{}',
          created_at TEXT NOT NULL
        )
      `);
      await pool.query(
        `CREATE INDEX IF NOT EXISTS idx_compliance_log_user ON compliance_log(user_id, created_at DESC)`,
      );
      await pool.query(`
        CREATE TABLE IF NOT EXISTS scan_jobs (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          trigger TEXT NOT NULL DEFAULT 'bulk',
          status TEXT NOT NULL DEFAULT 'queued',
          total INTEGER NOT NULL DEFAULT 0,
          completed INTEGER NOT NULL DEFAULT 0,
          failed INTEGER NOT NULL DEFAULT 0,
          skipped INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS scan_job_items (
          id TEXT PRIMARY KEY,
          job_id TEXT NOT NULL REFERENCES scan_jobs(id),
          workspace_id TEXT NOT NULL REFERENCES workspaces(id),
          status TEXT NOT NULL DEFAULT 'queued',
          error TEXT,
          audit_id TEXT REFERENCES audit_runs(id),
          duration_ms INTEGER,
          started_at TEXT,
          completed_at TEXT,
          created_at TEXT NOT NULL
        )
      `);
      await pool.query(
        `CREATE INDEX IF NOT EXISTS idx_scan_jobs_user ON scan_jobs(user_id, created_at DESC)`,
      );
      await pool.query(
        `CREATE INDEX IF NOT EXISTS idx_scan_jobs_status ON scan_jobs(status)`,
      );
      await pool.query(
        `CREATE INDEX IF NOT EXISTS idx_scan_job_items_job ON scan_job_items(job_id)`,
      );
      await pool.query(
        `CREATE INDEX IF NOT EXISTS idx_scan_job_items_workspace ON scan_job_items(workspace_id, status)`,
      );
      await pool.query(
        `ALTER TABLE audit_runs ADD COLUMN IF NOT EXISTS duration_ms INTEGER`,
      );
      await pool.query(
        `ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS next_scan_at TEXT`,
      );
    })();
  }
  await globalForPg.citepilotPgReady;
}

export async function ensureDb(): Promise<void> {
  if (isPostgres()) {
    await ensurePostgres();
  } else {
    getDb();
  }
}

export async function dbGet<T>(
  sql: string,
  params: unknown[] = [],
): Promise<T | undefined> {
  await ensureDb();
  if (isPostgres()) {
    const pool = getPool();
    const { rows } = await pool.query(toPgPlaceholders(sql), params);
    return rows[0] as T | undefined;
  }
  return getDb().prepare(sql).get(...params) as T | undefined;
}

export async function dbAll<T>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  await ensureDb();
  if (isPostgres()) {
    const pool = getPool();
    const { rows } = await pool.query(toPgPlaceholders(sql), params);
    return rows as T[];
  }
  return getDb().prepare(sql).all(...params) as T[];
}

export async function dbRun(
  sql: string,
  params: unknown[] = [],
): Promise<{ changes: number }> {
  await ensureDb();
  if (isPostgres()) {
    const pool = getPool();
    const result = await pool.query(toPgPlaceholders(sql), params);
    return { changes: result.rowCount ?? 0 };
  }
  const info = getDb().prepare(sql).run(...params);
  return { changes: info.changes };
}
