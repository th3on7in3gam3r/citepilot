export type HealthCheck = { ok: boolean; detail?: string };

export type HealthPayload = {
  ok: boolean;
  mode?: string;
  checks?: Record<string, HealthCheck>;
};

export type ServiceStatusLevel = "operational" | "degraded" | "outage" | "unknown";

export type PublicServiceStatus = {
  id: string;
  label: string;
  status: ServiceStatusLevel;
  detail?: string;
};

const CUSTOMER_SERVICES: {
  id: string;
  label: string;
  checkKeys: string[];
}[] = [
  { id: "ai-scan", label: "AI Scan Engine", checkKeys: ["openai"] },
  { id: "database", label: "Database", checkKeys: ["database"] },
  { id: "email", label: "Email Alerts", checkKeys: ["resend"] },
  { id: "cms", label: "CMS Publishing", checkKeys: ["webflow"] },
  { id: "stripe", label: "Stripe", checkKeys: ["stripe"] },
];

export function mapHealthToPublicServices(
  payload: HealthPayload | null,
): PublicServiceStatus[] {
  if (!payload?.checks) {
    return CUSTOMER_SERVICES.map((service) => ({
      id: service.id,
      label: service.label,
      status: "unknown" as const,
      detail: "Status monitoring is not configured.",
    }));
  }

  return CUSTOMER_SERVICES.map((service) => {
    const checks = service.checkKeys.map((key) => payload.checks?.[key]);
    const primary = checks[0];
    const status: ServiceStatusLevel =
      service.id === "database" && primary && !primary.ok
        ? "outage"
        : checks.every((c) => c?.ok)
          ? "operational"
          : checks.some((c) => c && !c.ok)
            ? "degraded"
            : "unknown";

    const detail = checks
      .map((c) => c?.detail)
      .filter(Boolean)
      .join(" · ");

    return {
      id: service.id,
      label: service.label,
      status,
      ...(detail ? { detail } : {}),
    };
  });
}

export function hasCustomerOutage(services: PublicServiceStatus[]): boolean {
  return services.some(
    (s) => s.status === "outage" || s.status === "degraded",
  );
}

/** Server-side fetch — HEALTH_SECRET never sent to the browser. */
export async function fetchInternalHealth(): Promise<{
  payload: HealthPayload | null;
  checkedAt: string;
}> {
  const secret = process.env.HEALTH_SECRET?.trim();
  const checkedAt = new Date().toISOString();

  if (!secret) {
    return { payload: null, checkedAt };
  }

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.RENDER_EXTERNAL_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    "http://localhost:3000";
  const origin = base.startsWith("http") ? base : `https://${base}`;

  try {
    const res = await fetch(`${origin.replace(/\/$/, "")}/api/health`, {
      headers: { "x-health-secret": secret },
      cache: "no-store",
    });
    const payload = (await res.json()) as HealthPayload;
    return { payload, checkedAt };
  } catch {
    return { payload: null, checkedAt };
  }
}
