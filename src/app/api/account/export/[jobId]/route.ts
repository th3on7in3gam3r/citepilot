import { NextResponse } from "next/server";
import {
  exportJobZipBuffer,
  getExportJob,
} from "@/lib/account/export";
import { getRealSessionUser } from "@/lib/auth/server";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type Params = { params: Promise<{ jobId: string }> };

export const GET = withApiLogging(async function GET(request: Request, { params }: Params) {
  const session = await getRealSessionUser(request);
  if (!session?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { jobId } = await params;
  const job = await getExportJob(jobId, session.id);
  if (!job) {
    return NextResponse.json({ error: "Export not found" }, { status: 404 });
  }

  if (Date.parse(job.expires_at) < Date.now()) {
    return NextResponse.json({ error: "Export expired" }, { status: 410 });
  }

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    error: job.error_message,
    downloadUrl:
      job.status === "ready"
        ? `/api/account/export/${job.id}/download`
        : null,
  });
});
