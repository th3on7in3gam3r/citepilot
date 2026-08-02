import { NextResponse } from "next/server";
import { fetchDiscussions } from "@/lib/discussions/fetch-discussions";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

/** @deprecated Use GET /api/discussions — kept for backwards compatibility */
export const GET = withApiLogging(async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  const threads = await fetchDiscussions(q);
  return NextResponse.json({ threads });
});
