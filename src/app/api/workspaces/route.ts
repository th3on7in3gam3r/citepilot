import { NextResponse } from "next/server";
import type { OnboardingAnswers } from "@/lib/onboarding";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import {
  getWorkspaceLimitsForUser,
} from "@/lib/billing/limits-server";
import {
  workspaceLimitUpgradeError,
} from "@/lib/billing/limits";
import { WORKSPACE_COOKIE } from "@/lib/constants";
import { WORKSPACES_RATE_LIMIT_PER_HOUR } from "@/lib/rate-limit/constants";
import { rateLimitHeaders } from "@/lib/rate-limit/hourly";
import { enforceHourlyRateLimit } from "@/lib/rate-limit/request";
import {
  createWorkspace,
  enrichSnapshotWithBacklinks,
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

    const rate = await enforceHourlyRateLimit(
      `workspaces:${userId}`,
      WORKSPACES_RATE_LIMIT_PER_HOUR,
      `Workspace API limit reached (${WORKSPACES_RATE_LIMIT_PER_HOUR}/hour).`,
    );
    if (rate instanceof NextResponse) return rate;

    const limits = await getWorkspaceLimitsForUser(userId);

    const workspaces = userId
      ? await listWorkspacesForUser(userId)
      : await listRecentWorkspaces(10);

    const snapshots = await Promise.all(
      workspaces.map(async (workspace) => {
        const snapshot = await enrichSnapshotWithBacklinks(
          toSnapshot(workspace),
          workspace.id,
        );
        return {
          id: workspace.id,
          domain: workspace.domain,
          businessType: workspace.businessType,
          buyerQuestion: workspace.buyerQuestion,
          updatedAt: workspace.updatedAt,
          citationScore: snapshot.citationScore,
          hasRealAudit: snapshot.hasRealAudit,
          workspace: snapshot,
        };
      }),
    );

    return NextResponse.json(
      {
        workspaces: snapshots,
        limits,
      },
      { headers: rateLimitHeaders(rate) },
    );
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

    const rate = await enforceHourlyRateLimit(
      `workspaces:${userId}`,
      WORKSPACES_RATE_LIMIT_PER_HOUR,
      `Workspace API limit reached (${WORKSPACES_RATE_LIMIT_PER_HOUR}/hour).`,
    );
    if (rate instanceof NextResponse) return rate;

    const limits = await getWorkspaceLimitsForUser(userId);
    if (userId && !limits.canCreate) {
      return NextResponse.json(
        {
          error: workspaceLimitUpgradeError(limits),
          code: "WORKSPACE_LIMIT",
          limits,
        },
        { status: 403 },
      );
    }

    const body = (await request.json()) as OnboardingAnswers;
    if (!body.domain?.trim()) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }

    const workspace = await createWorkspace(body, userId);
    const snapshot = await enrichSnapshotWithBacklinks(
      toSnapshot(workspace),
      workspace.id,
    );

    const response = NextResponse.json({
      id: workspace.id,
      workspace: snapshot,
      limits: await getWorkspaceLimitsForUser(userId),
    });

    response.cookies.set(WORKSPACE_COOKIE, workspace.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    for (const [key, value] of Object.entries(rateLimitHeaders(rate))) {
      response.headers.set(key, value);
    }

    return response;
  } catch (error) {
    console.error("POST /api/workspaces", error);
    return NextResponse.json(
      { error: "Failed to create workspace" },
      { status: 500 },
    );
  }
}
