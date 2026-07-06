import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { PILOT_UPGRADE_MESSAGE, userHasPilotAccess } from "@/lib/billing/access";
import { cleanDomainInput, domainFormatStatus } from "@/lib/onboarding/domain-validation";
import {
  activateGrowthLoopForWorkspace,
  runGrowthLoopForWorkspace,
} from "@/lib/growth-loop/run";
import {
  cmsProviderLabel,
  resolveFirstPublishProvider,
} from "@/lib/growth-loop/publish-to-cms";
import { captureServerException } from "@/lib/observability/sentry";
import { mergePreferences } from "@/lib/settings";
import { getWorkspaceById, updateWorkspace } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";
export const maxDuration = 300;

type Params = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireApiUser(_request);
    if (user instanceof NextResponse) return user;
    const userId = apiUserId(user);
    if (!userId) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const { id: workspaceId } = await params;
    const workspace = await getWorkspaceById(workspaceId, userId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const loop = workspace.preferences.growthLoop;
    const cmsProvider = await resolveFirstPublishProvider(workspaceId);

    return NextResponse.json({
      enabled: loop.enabled,
      siteUrl: loop.siteUrl || workspace.domain,
      dailyArticles: loop.dailyArticles,
      autoPublish: loop.autoPublish,
      autoBacklinks: loop.autoBacklinks,
      autoRescan: loop.autoRescan,
      lastRunAt: loop.lastRunAt,
      lastRunSummary: loop.lastRunSummary,
      cmsConnected: Boolean(cmsProvider),
      cmsProvider: cmsProvider ? cmsProviderLabel(cmsProvider) : null,
      autopilotEnabled: workspace.preferences.autopilot.enabled,
    });
  } catch (error) {
    captureServerException(error, {
      route: "GET /api/workspaces/[id]/growth-loop",
    });
    return NextResponse.json({ error: "Failed to load Growth Loop" }, { status: 500 });
  }
});

export const POST = withApiLogging(async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser(request);
    if (user instanceof NextResponse) return user;
    const userId = apiUserId(user);
    if (!userId) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    if (!(await userHasPilotAccess(userId))) {
      return NextResponse.json(
        {
          error: PILOT_UPGRADE_MESSAGE,
          code: "PILOT_REQUIRED",
          upgradeUrl: "/pricing",
        },
        { status: 402 },
      );
    }

    const { id: workspaceId } = await params;
    const body = (await request.json()) as {
      action?: "activate" | "deactivate" | "run";
      siteUrl?: string;
      dailyArticles?: boolean;
      autoPublish?: boolean;
      autoBacklinks?: boolean;
      autoRescan?: boolean;
      runNow?: boolean;
    };

    const workspace = await getWorkspaceById(workspaceId, userId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    if (body.action === "deactivate") {
      await updateWorkspace(
        workspaceId,
        {
          preferences: mergePreferences(workspace.preferences, {
            growthLoop: { enabled: false },
          }),
        },
        userId,
      );
      return NextResponse.json({ ok: true, enabled: false });
    }

    if (body.action === "run") {
      const result = await runGrowthLoopForWorkspace({
        workspaceId,
        userId,
        trigger: "manual",
      });
      if (!result.ok && !result.skipped) {
        return NextResponse.json(
          { error: result.error ?? "Growth Loop run failed" },
          { status: 500 },
        );
      }
      return NextResponse.json({ ...result, ok: true });
    }

    const siteUrl = (body.siteUrl ?? workspace.domain).trim();
    const domainStatus = domainFormatStatus(siteUrl);
    if (domainStatus !== "valid") {
      return NextResponse.json(
        { error: "Enter a valid website URL (e.g. https://yourbrand.com)" },
        { status: 400 },
      );
    }

    const normalizedUrl = siteUrl.startsWith("http")
      ? siteUrl.replace(/\/$/, "")
      : `https://${cleanDomainInput(siteUrl)}`;

    const options = {
      dailyArticles: body.dailyArticles ?? true,
      autoPublish: body.autoPublish ?? true,
      autoBacklinks: body.autoBacklinks ?? true,
      autoRescan: body.autoRescan ?? true,
    };

    const activated = await activateGrowthLoopForWorkspace({
      workspaceId,
      userId,
      siteUrl: normalizedUrl,
      options,
    });

    if (!activated.ok) {
      return NextResponse.json(
        { error: activated.error ?? "Activation failed" },
        { status: 500 },
      );
    }

    let firstRun: Awaited<ReturnType<typeof runGrowthLoopForWorkspace>> | undefined;
    if (body.runNow !== false) {
      firstRun = await runGrowthLoopForWorkspace({
        workspaceId,
        userId,
        trigger: "manual",
      });
    }

    return NextResponse.json({
      ok: true,
      enabled: true,
      siteUrl: normalizedUrl,
      ...options,
      firstRun,
    });
  } catch (error) {
    captureServerException(error, {
      route: "POST /api/workspaces/[id]/growth-loop",
    });
    console.error("POST /api/workspaces/[id]/growth-loop", error);
    return NextResponse.json({ error: "Growth Loop request failed" }, { status: 500 });
  }
});

export const PATCH = POST;
