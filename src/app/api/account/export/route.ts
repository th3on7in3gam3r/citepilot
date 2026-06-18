import { NextResponse } from "next/server";
import { createExportJob } from "@/lib/account/export";
import { getRealSessionUser } from "@/lib/auth/server";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const POST = withApiLogging(async function POST(request: Request) {
  const session = await getRealSessionUser(request);
  if (!session?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { jobId } = await createExportJob(session.id);
  return NextResponse.json({ jobId, status: "processing" });
});
