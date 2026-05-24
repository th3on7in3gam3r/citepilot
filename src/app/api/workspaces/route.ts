import { NextResponse } from "next/server";
import type { OnboardingAnswers } from "@/lib/onboarding";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { WORKSPACE_COOKIE } from "@/lib/constants";
import {
  createWorkspace,
  listRecentWorkspaces,
  listWorkspacesForUser,
  toSnapshot,
} from "@/lib/server/workspace";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireApiUser(request);
    if (user instanceof NextResponse) return user;
    const userId = apiUserId(user);

    const workspaces = userId
      ? await listWorkspacesForUser(userId)
      : await listRecentWorkspaces(10);

    return NextResponse.json({
      workspaces: workspaces.map((workspace) => ({
        id: workspace.id,
        workspace: toSnapshot(workspace),
      })),
    });
  } catch (error) {
    console.error("GET /api/workspaces", error);
    return NextResponse.json(
      { error: "Failed to list workspaces" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    if (user instanceof NextResponse) return user;
    const userId = apiUserId(user);

    const body = (await request.json()) as OnboardingAnswers;
    if (!body.domain?.trim()) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }

    const workspace = await createWorkspace(body, userId);
    const snapshot = toSnapshot(workspace);

    const response = NextResponse.json({
      id: workspace.id,
      workspace: snapshot,
    });

    response.cookies.set(WORKSPACE_COOKIE, workspace.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch (error) {
    console.error("POST /api/workspaces", error);
    return NextResponse.json(
      { error: "Failed to create workspace" },
      { status: 500 },
    );
  }
}
