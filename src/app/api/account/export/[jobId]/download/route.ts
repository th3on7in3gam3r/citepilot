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
  if (!job || job.status !== "ready") {
    return NextResponse.json({ error: "Export not ready" }, { status: 404 });
  }

  const buffer = exportJobZipBuffer(job);
  if (!buffer) {
    return NextResponse.json({ error: "Export data missing" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="citepilot-data-export.zip"`,
      "Cache-Control": "no-store",
    },
  });
});
