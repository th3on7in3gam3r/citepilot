import { NextResponse } from "next/server";
import {
  ensureDb,
  isPostgres,
  neonDbErrorDetail,
  postgresEnvVar,
  postgresHealthDetail,
} from "@/lib/db";
import {
  neonAuthEnvCheck,
  probeNeonAuthUpstream,
} from "@/lib/auth/neon-auth-health";
import { webflowEnvStatus } from "@/lib/webflow/config";
import { stripeEnvStatus } from "@/lib/stripe/config";
import { isEmailConfigured } from "@/lib/email/config";
import { isGscConfigured } from "@/lib/gsc/config";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type Check = { ok: boolean; detail?: string };

function hasKey(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

function opsReportConfigured(): boolean {
  return Boolean(
    process.env.OPS_REPORT_EMAIL?.trim() ||
      process.env.ADMIN_OPS_EMAIL?.trim() ||
      isEmailConfigured(),
  );
}

function isAuthorizedHealthRequest(request: Request): boolean {
  const secret = process.env.HEALTH_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("x-health-secret") === secret;
}

function buildDetailedChecks(): Record<string, Check> {
  const checks: Record<string, Check> = {
    database: { ok: false },
    openai: { ok: hasKey("OPENAI_API_KEY") },
    perplexity: { ok: hasKey("PERPLEXITY_API_KEY") },
    stackexchange: { ok: hasKey("STACKEXCHANGE_KEY") },
    serper: { ok: hasKey("SERPER_API_KEY") },
    serpapi: { ok: hasKey("SERPAPI_API_KEY") },
    tavily: { ok: hasKey("TAVILY_API_KEY") },
    openPageRank: { ok: hasKey("OPEN_PAGERANK_API_KEY") },
    admin: {
      ok: Boolean(process.env.ADMIN_EMAILS?.trim()),
      detail: process.env.ADMIN_EMAILS?.trim()
        ? "Admin routes require ADMIN_EMAILS session"
        : "Set ADMIN_EMAILS (comma-separated admin emails)",
    },
    neonAuth: neonAuthEnvCheck(),
    webflow: (() => {
      const env = webflowEnvStatus();
      return { ok: env.ok, detail: env.detail };
    })(),
    stripe: (() => {
      const env = stripeEnvStatus();
      return { ok: env.ok, detail: env.detail };
    })(),
    resend: {
      ok: isEmailConfigured(),
      detail: isEmailConfigured()
        ? "Weekly digest + audit alerts enabled"
        : "Set RESEND_API_KEY and EMAIL_FROM",
    },
    googleSearchConsole: {
      ok: isGscConfigured(),
      detail: isGscConfigured()
        ? "OAuth ready for Analytics → Google tab"
        : "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET",
    },
    cron: {
      ok: hasKey("CRON_SECRET"),
      detail: hasKey("CRON_SECRET")
        ? "Weekly digest cron protected"
        : "Set CRON_SECRET for /api/cron/weekly-digest",
    },
    opsReport: {
      ok: opsReportConfigured(),
      detail: opsReportConfigured()
        ? "Weekly ops report recipient configured"
        : "Set OPS_REPORT_EMAIL + RESEND_API_KEY for ops report",
    },
  };

  return checks;
}

export const GET = withApiLogging(async function GET(request: Request) {
  if (!isAuthorizedHealthRequest(request)) {
    return NextResponse.json({ ok: true });
  }

  const checks = buildDetailedChecks();
  const pgMeta = postgresHealthDetail();

  try {
    await ensureDb();
    checks.database = {
      ok: true,
      detail: isPostgres()
        ? `postgres (${postgresEnvVar() ?? "DATABASE_URL"}; ${pgMeta.driver}; ${pgMeta.hostKind}; pooled=${pgMeta.hasPooled}; direct=${pgMeta.hasDirect})`
        : "sqlite (.data/citepilot.db)",
    };
  } catch (error) {
    checks.database = {
      ok: false,
      detail: `${neonDbErrorDetail(error)} [${pgMeta.driver}; ${pgMeta.hostKind}; pooled=${pgMeta.hasPooled}; direct=${pgMeta.hasDirect}]`,
    };
  }

  if (checks.neonAuth.ok) {
    const upstream = await probeNeonAuthUpstream();
    checks.neonAuth = {
      ok: upstream.ok,
      detail: upstream.detail,
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
});
