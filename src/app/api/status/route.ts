import { NextResponse } from "next/server";
import {
  fetchInternalHealth,
  hasCustomerOutage,
  mapHealthToPublicServices,
} from "@/lib/ops/health-status";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getStatus() {
  const { payload, checkedAt } = await fetchInternalHealth();
  const services = mapHealthToPublicServices(payload);
  return {
    checkedAt,
    services,
    degraded: hasCustomerOutage(services),
  };
}

export const GET = withApiLogging(async () => {
  const body = await getStatus();
  return NextResponse.json(body);
});
