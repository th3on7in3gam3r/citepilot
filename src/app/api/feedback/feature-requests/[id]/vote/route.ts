import { NextResponse } from "next/server";
import { requireApiUser, apiUserId } from "@/lib/auth/api";
import { toggleFeatureRequestVote } from "@/lib/feedback/store";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export const POST = withApiLogging(async function POST(request: Request, { params }: Params) {
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const result = await toggleFeatureRequestVote(id, userId);
  return NextResponse.json(result);
});
