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
