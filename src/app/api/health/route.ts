import { NextResponse } from "next/server";
import { isNeonAuthEnabled } from "@/lib/auth/server";
import { ensureDb, isPostgres, postgresEnvVar } from "@/lib/db";
import { webflowEnvStatus } from "@/lib/webflow/config";
import { stripeEnvStatus } from "@/lib/stripe/config";

export const runtime = "nodejs";

type Check = { ok: boolean; detail?: string };

function hasKey(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

export async function GET() {
  const checks: Record<string, Check> = {
    database: { ok: false },
    openai: { ok: hasKey("OPENAI_API_KEY") },
    stackexchange: { ok: hasKey("STACKEXCHANGE_KEY") },
    serper: { ok: hasKey("SERPER_API_KEY") },
    tavily: { ok: hasKey("TAVILY_API_KEY") },
    admin: {
      ok: hasKey("ADMIN_SECRET"),
      detail: hasKey("ADMIN_SECRET")
        ? "Admin routes require sign-in"
        : "Dev mode — set ADMIN_SECRET for production",
    },
    neonAuth: (() => {
      const baseUrl = process.env.NEON_AUTH_BASE_URL?.trim();
      const secret = process.env.NEON_AUTH_COOKIE_SECRET?.trim();
      if (baseUrl && secret && secret.length >= 32) {
        return {
          ok: true,
          detail: "Dashboard + workspace APIs require sign-in",
        };
      }
      if (!baseUrl && !secret) {
        return {
          ok: false,
          detail: "Missing NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET",
        };
      }
      if (!baseUrl) {
        return { ok: false, detail: "Missing NEON_AUTH_BASE_URL" };
      }
      if (!secret) {
        return {
          ok: false,
          detail: "Missing NEON_AUTH_COOKIE_SECRET (generate: openssl rand -base64 32)",
        };
      }
      return {
        ok: false,
        detail: `NEON_AUTH_COOKIE_SECRET too short (${secret.length} chars, need 32+)`,
      };
    })(),
    webflow: (() => {
      const env = webflowEnvStatus();
      return { ok: env.ok, detail: env.detail };
    })(),
    stripe: (() => {
      const env = stripeEnvStatus();
      return { ok: env.ok, detail: env.detail };
    })(),
  };

  try {
    await ensureDb();
    checks.database = {
      ok: true,
      detail: isPostgres()
        ? `postgres (${postgresEnvVar() ?? "DATABASE_URL"})`
        : "sqlite (.data/citepilot.db)",
    };
  } catch (error) {
    checks.database = {
      ok: false,
      detail: error instanceof Error ? error.message : "Database unavailable",
    };
  }

  const ok = checks.database.ok;
  return NextResponse.json(
    {
      ok,
      mode: process.env.NEXT_PUBLIC_AUDIT_MODE ?? "technical",
      checks,
    },
    { status: ok ? 200 : 503 },
  );
}
