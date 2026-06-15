import { NextResponse } from "next/server";
import type { DiscussionThread } from "@/lib/api-types";
import { fetchDiscussions } from "@/lib/discussions/fetch-discussions";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const GET = withApiLogging(async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  try {
    const threads = await fetchDiscussions(q);
    return NextResponse.json({ threads });
  } catch (error) {
    console.error("GET /api/discussions", error);
    return NextResponse.json({ threads: [] satisfies DiscussionThread[] });
  }
});
