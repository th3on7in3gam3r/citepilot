import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { searchAdminUsers } from "@/lib/admin/metrics";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const GET = withApiLogging(async function GET(request: Request) {
  const admin = await requireAdminApi(request);
  if (admin instanceof Response) return admin;

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  const users = await searchAdminUsers(q, 100);
  return NextResponse.json({ users });
});
