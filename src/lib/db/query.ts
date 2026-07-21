import { Pool as NeonPool } from "@neondatabase/serverless";
import { Pool as PgPool, type PoolConfig } from "pg";
import { POSTGRES_INIT_SQL } from "@/lib/db/postgres-schema";
import { getDb } from "@/lib/db/sqlite";

/** Minimal pool surface shared by `pg` and `@neondatabase/serverless`. */
type CitePilotPool = {
  query: (
    text: string,
    values?: unknown[],
  ) => Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }>;
  end: () => Promise<void>;
  on: (event: "error", listener: (err: Error) => void) => void;
};

const globalForPg = globalThis as unknown as {
  citepilotPool?: CitePilotPool;
  citepilotPgReady?: Promise<void>;
};

/**
 * Postgres URL for runtime queries (Neon, Supabase, or any Postgres).
 * Prefer DATABASE_URL_POOLED (PgBouncer / Supabase transaction pooler :6543).
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

export function isNeonHostname(connectionString: string): boolean {
  try {
    return new URL(connectionString).hostname.includes(".neon.tech");
  } catch {
    return false;
  }
}

/**
 * Neon serverless uses WebSockets (Vercel-friendly). Supabase / generic Postgres
 * need TCP via `pg`. Render is a long-lived Node process — always use TCP there.
 */
export function shouldUseTcpPostgres(connectionString: string): boolean {
  if (process.env.RENDER === "true") return true;
  if (process.env.USE_PG_TCP === "1") return true;
  return !isNeonHostname(connectionString);
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

function tcpPoolConfig(connectionString: string): PoolConfig {
  const config: PoolConfig = { connectionString };
  try {
    const host = new URL(connectionString).hostname;
    // Supabase (and most managed PG) require TLS; URL may omit sslmode.
    if (
      host.includes("supabase.co") ||
      host.includes("supabase.com") ||
      /sslmode=require/i.test(connectionString)
    ) {
      config.ssl = { rejectUnauthorized: false };
    }
  } catch {
    // leave defaults
  }
  return config;
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

/** Neon Free/Launch compute hours exhausted — surfaces as XX000 / HTTP 412 upstream. */
export function isNeonComputeQuotaError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  if (/compute time quota|COMPUTE_QUOTA_EXCEEDED/i.test(message)) {
    return true;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    String((error as { code: unknown }).code) === "XX000" &&
    /quota/i.test(message)
  ) {
    return true;
  }
  return false;
}

export function neonDbErrorDetail(error: unknown): string {
  if (isNeonComputeQuotaError(error)) {
    return "Neon COMPUTE_QUOTA_EXCEEDED — upgrade plan or wait for monthly quota reset";
  }
  return error instanceof Error ? error.message : "Database unavailable";
}

function dropPool(pool: CitePilotPool): void {
  if (globalForPg.citepilotPool === pool) {
    globalForPg.citepilotPool = undefined;
    globalForPg.citepilotPgReady = undefined;
  }
  void pool.end().catch(() => {});
}

function createPool(connectionString: string): CitePilotPool {
  if (shouldUseTcpPostgres(connectionString)) {
    return new PgPool(tcpPoolConfig(connectionString)) as unknown as CitePilotPool;
  }
  return new NeonPool({ connectionString }) as unknown as CitePilotPool;
}

function getPool(): CitePilotPool {
  const connectionString = postgresConnectionString();
  if (!connectionString) {
    throw new Error("DATABASE_URL or NEON_URL is required for Postgres");
  }
  if (!globalForPg.citepilotPool) {
    const pool = createPool(connectionString);
    // Idle client errors must be handled or Node exits (status 129).
    pool.on("error", (err: Error) => {
      if (isNeonComputeQuotaError(err)) {
        console.error(
          "[db] Neon compute quota exceeded — upgrade plan or wait for reset",
        );
      } else {
        console.error("[db] Unexpected pool error", err.message);
      }
      dropPool(pool);
    });
    globalForPg.citepilotPool = pool;
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
      // DDL against the direct / session endpoint when set (Supabase transaction
      // pooler :6543 can reject or stall some migration statements).
      const direct = postgresDirectConnectionString();
      const runtime = postgresConnectionString();
      if (!runtime) {
        throw new Error("DATABASE_URL or NEON_URL is required for Postgres");
      }
      const ddlUrl =
        direct && direct !== runtime ? direct : runtime;
      const ownsDdlPool = ddlUrl !== runtime;
      const ddlPool = ownsDdlPool ? createPool(ddlUrl) : getPool();
      const statements = POSTGRES_INIT_SQL.split(";")
        .map((s) => s.trim())
        .filter(Boolean);
      try {
        for (const statement of statements) {
          await ddlPool.query(statement);
        }
        await ddlPool.query(
          `ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS user_id TEXT`,
        );
        await ddlPool.query(
          `ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS webflow_item_id TEXT`,
        );
        await ddlPool.query(
          `ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS webflow_published_at TEXT`,
        );
        await ddlPool.query(
          `ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS webflow_live_url TEXT`,
        );
        await ddlPool.query(
          `ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS cover_image_url TEXT`,
        );
        await ddlPool.query(
          `ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS cover_image_alt TEXT`,
        );
        await ddlPool.query(
          `ALTER TABLE fleet_api_keys ADD COLUMN IF NOT EXISTS workspace_id TEXT`,
        );
        await ddlPool.query(
          `ALTER TABLE audit_shares ADD COLUMN IF NOT EXISTS password_hash TEXT`,
        );
        await ddlPool.query(
          `ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS display_name TEXT`,
        );
        await ddlPool.query(
          `ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'`,
        );
        await ddlPool.query(
          `ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS archived_at TEXT`,
        );
        await ddlPool.query(`
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
        await ddlPool.query(
          `CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id)`,
        );
        await ddlPool.query(
          `CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id)`,
        );
        await ddlPool.query(
          `ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS token TEXT`,
        );
        await ddlPool.query(
          `ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'`,
        );
        await ddlPool.query(
          `CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_members_token ON workspace_members(token) WHERE token IS NOT NULL`,
        );
        await ddlPool.query(
          `UPDATE workspace_members SET status = 'accepted' WHERE accepted_at IS NOT NULL AND status = 'pending'`,
        );
        await ddlPool.query(
          `ALTER TABLE user_onboarding ADD COLUMN IF NOT EXISTS onboarding_completed_at TEXT`,
        );
        await ddlPool.query(
          `ALTER TABLE user_onboarding ADD COLUMN IF NOT EXISTS signup_source TEXT`,
        );
        await ddlPool.query(
          `ALTER TABLE user_onboarding ADD COLUMN IF NOT EXISTS signup_campaign TEXT`,
        );
        await ddlPool.query(
          `ALTER TABLE user_onboarding ADD COLUMN IF NOT EXISTS signup_medium TEXT`,
        );
        await ddlPool.query(`
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
        await ddlPool.query(
          `CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created ON admin_audit_log(created_at DESC)`,
        );
        await ddlPool.query(`
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
        await ddlPool.query(
          `CREATE INDEX IF NOT EXISTS idx_domain_score_profiles_public ON domain_score_profiles(is_public)`,
        );
        await ddlPool.query(
          `CREATE INDEX IF NOT EXISTS idx_audit_domain ON audit_runs(domain)`,
        );
        await ddlPool.query(`
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
        await ddlPool.query(`
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
        await ddlPool.query(
          `CREATE UNIQUE INDEX IF NOT EXISTS idx_user_accounts_cancellation_token ON user_accounts(cancellation_token) WHERE cancellation_token IS NOT NULL`,
        );
        await ddlPool.query(`
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
        await ddlPool.query(
          `CREATE INDEX IF NOT EXISTS idx_account_export_jobs_user ON account_export_jobs(user_id, created_at DESC)`,
        );
        await ddlPool.query(`
        CREATE TABLE IF NOT EXISTS compliance_log (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          action TEXT NOT NULL,
          metadata TEXT NOT NULL DEFAULT '{}',
          created_at TEXT NOT NULL
        )
      `);
        await ddlPool.query(
          `CREATE INDEX IF NOT EXISTS idx_compliance_log_user ON compliance_log(user_id, created_at DESC)`,
        );
        await ddlPool.query(`
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
        await ddlPool.query(`
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
        await ddlPool.query(
          `CREATE INDEX IF NOT EXISTS idx_scan_jobs_user ON scan_jobs(user_id, created_at DESC)`,
        );
        await ddlPool.query(
          `CREATE INDEX IF NOT EXISTS idx_scan_jobs_status ON scan_jobs(status)`,
        );
        await ddlPool.query(
          `CREATE INDEX IF NOT EXISTS idx_scan_job_items_job ON scan_job_items(job_id)`,
        );
        await ddlPool.query(
          `CREATE INDEX IF NOT EXISTS idx_scan_job_items_workspace ON scan_job_items(workspace_id, status)`,
        );
        await ddlPool.query(
          `ALTER TABLE audit_runs ADD COLUMN IF NOT EXISTS duration_ms INTEGER`,
        );
        await ddlPool.query(
          `ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS next_scan_at TEXT`,
        );
        await ddlPool.query(
          `ALTER TABLE platform_citation_checks ADD COLUMN IF NOT EXISTS probe_notes TEXT`,
        );
        await ddlPool.query(
          `ALTER TABLE platform_citation_checks ADD COLUMN IF NOT EXISTS scan_unavailable INTEGER NOT NULL DEFAULT 0`,
        );
        await ddlPool.query(`
        CREATE TABLE IF NOT EXISTS browser_scan_usage (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL REFERENCES workspaces(id),
          platform TEXT NOT NULL,
          prompt TEXT NOT NULL,
          success INTEGER NOT NULL DEFAULT 1,
          cost_cents INTEGER NOT NULL DEFAULT 8,
          scanned_at TEXT NOT NULL,
          notes TEXT
        )
      `);
        await ddlPool.query(
          `CREATE INDEX IF NOT EXISTS idx_browser_scan_usage_workspace_day ON browser_scan_usage(workspace_id, scanned_at)`,
        );
      } finally {
        if (ownsDdlPool) {
          void ddlPool.end().catch(() => {});
        }
      }
    })().catch((error) => {
      // Allow the next request to retry instead of sticking on a rejected promise.
      globalForPg.citepilotPgReady = undefined;
      throw error;
    });
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
