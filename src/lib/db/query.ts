import { Pool } from "@neondatabase/serverless";
import { POSTGRES_INIT_SQL } from "@/lib/db/postgres-schema";
import { getDb } from "@/lib/db/sqlite";

const globalForPg = globalThis as unknown as {
  citepilotPool?: Pool;
  citepilotPgReady?: Promise<void>;
};

/** Neon / Postgres URL — accepts DATABASE_URL (Vercel default) or NEON_URL */
export function postgresConnectionString(): string | undefined {
  const url =
    process.env.DATABASE_URL?.trim() || process.env.NEON_URL?.trim();
  return url || undefined;
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
