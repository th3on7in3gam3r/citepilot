import { NextResponse } from "next/server";
import { optionalApiUser, requireApiUser, apiUserId } from "@/lib/auth/api";
import { getSessionUser } from "@/lib/auth/server";
import {
  createFeatureRequest,
  listFeatureRequests,
} from "@/lib/feedback/store";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const GET = withApiLogging(async function GET(request: Request) {
  const { userId } = await optionalApiUser(request);
  const requests = await listFeatureRequests(userId);
  return NextResponse.json({ requests });
});

export const POST = withApiLogging(async function POST(request: Request) {
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = (await request.json()) as { title?: string; description?: string };
  const title = body.title?.trim();
  const description = body.description?.trim() ?? "";

  if (!title || title.length < 4) {
    return NextResponse.json(
      { error: "Title must be at least 4 characters" },
      { status: 400 },
    );
  }
  if (title.length > 120) {
    return NextResponse.json({ error: "Title is too long" }, { status: 400 });
  }
  if (description.length > 2000) {
    return NextResponse.json({ error: "Description is too long" }, { status: 400 });
  }

  const sessionUser = await getSessionUser(request);
  const created = await createFeatureRequest({
    title,
    description,
    userId,
    submitterEmail: sessionUser?.email ?? null,
  });

  return NextResponse.json({ request: created }, { status: 201 });
});
