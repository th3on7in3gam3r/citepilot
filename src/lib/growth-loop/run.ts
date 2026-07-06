import { userHasPilotAccess } from "@/lib/billing/access";
import { ensureBlogCoverForPost } from "@/lib/blog/generate-cover";
import { buildGenerateContentOpportunities } from "@/lib/content-strategy/opportunities";
import { generateWorkspaceArticle } from "@/lib/content/generate-workspace-article";
import {
  cronDailyPeriodKey,
  recordCronDispatch,
  wasCronDispatched,
} from "@/lib/cron/dispatch-log";
import {
  cmsProviderLabel,
  publishBlogPostToCms,
  resolveFirstPublishProvider,
} from "@/lib/growth-loop/publish-to-cms";
import { createPlacementRequest, setNetworkOptIn } from "@/lib/backlinks/store";
import {
  mergePreferences,
  type GrowthLoopPreferences,
} from "@/lib/settings";
import {
  enrichSnapshotWithBacklinks,
  getWorkspaceById,
  toSnapshot,
  updateWorkspace,
} from "@/lib/server/workspace";
import { computeNextScanAt } from "@/lib/scans/schedule";
import { dbRun } from "@/lib/db";

export const GROWTH_LOOP_JOB = "growth-loop-daily";

export type GrowthLoopRunResult = {
  ok: boolean;
  skipped?: string;
  error?: string;
  articleTitle?: string;
  articleSlug?: string;
  cmsUrl?: string | null;
  backlinkRequested?: boolean;
  publishError?: string;
  backlinkError?: string;
};

function articleLiveUrl(input: {
  cmsUrl: string | null;
  siteUrl: string;
  slug: string;
}): string {
  if (input.cmsUrl) return input.cmsUrl;
  const base = input.siteUrl.replace(/\/$/, "");
  if (base.startsWith("http")) {
    return `${base}/blog/${input.slug}`;
  }
  return `https://${base}/blog/${input.slug}`;
}

/** Enable autopilot, scan schedule, and backlink network when activating Growth Loop. */
export async function activateGrowthLoopForWorkspace(input: {
  workspaceId: string;
  userId: string;
  siteUrl: string;
  options: Pick<
    GrowthLoopPreferences,
    "dailyArticles" | "autoPublish" | "autoBacklinks" | "autoRescan"
  >;
}): Promise<{ ok: boolean; error?: string }> {
  const workspace = await getWorkspaceById(input.workspaceId, input.userId);
  if (!workspace) return { ok: false, error: "Workspace not found" };

  const growthLoop: GrowthLoopPreferences = {
    ...workspace.preferences.growthLoop,
    enabled: true,
    siteUrl: input.siteUrl.trim(),
    dailyArticles: input.options.dailyArticles,
    autoPublish: input.options.autoPublish,
    autoBacklinks: input.options.autoBacklinks,
    autoRescan: input.options.autoRescan,
  };

  const prefsPatch = {
    growthLoop,
    ...(input.options.autoRescan
      ? {
          autopilot: {
            enabled: true,
            emailReport: true,
            autoInsights: true,
          },
          scanSchedule: {
            frequency: "weekly" as const,
            dayOfWeek: 1,
            hour: 8 as const,
            timezone: workspace.preferences.scanSchedule.timezone,
          },
        }
      : {}),
  };

  await updateWorkspace(
    input.workspaceId,
    {
      domain: input.siteUrl,
      preferences: prefsPatch,
    },
    input.userId,
  );

  if (input.options.autoRescan) {
    const schedule = {
      frequency: "weekly" as const,
      dayOfWeek: 1,
      hour: 8 as const,
      timezone: workspace.preferences.scanSchedule.timezone,
    };
    const nextScanAt = computeNextScanAt(schedule);
    await dbRun(
      `UPDATE workspaces SET next_scan_at = ?, updated_at = ? WHERE id = ?`,
      [nextScanAt, new Date().toISOString(), input.workspaceId],
    );
  }

  if (input.options.autoBacklinks) {
    await setNetworkOptIn({
      workspaceId: input.workspaceId,
      userId: input.userId,
      domain: workspace.domain,
      businessType: workspace.businessType,
      optedIn: true,
    });
  }

  return { ok: true };
}

export async function runGrowthLoopForWorkspace(input: {
  workspaceId: string;
  userId: string;
  trigger: "scheduled" | "manual";
}): Promise<GrowthLoopRunResult> {
  if (!process.env.OPENAI_API_KEY) {
    return { ok: false, error: "OPENAI_API_KEY not configured" };
  }

  const paid = await userHasPilotAccess(input.userId);
  if (!paid) {
    return { ok: false, error: "Pilot or Fleet required for Growth Loop" };
  }

  const workspace = await getWorkspaceById(input.workspaceId, input.userId);
  if (!workspace) {
    return { ok: false, error: "Workspace not found" };
  }

  const loop = workspace.preferences.growthLoop;
  if (!loop.enabled) {
    return { ok: true, skipped: "growth loop disabled" };
  }

  if (input.trigger === "scheduled" && !loop.dailyArticles) {
    return { ok: true, skipped: "daily articles disabled" };
  }

  const periodKey = cronDailyPeriodKey(GROWTH_LOOP_JOB, new Date());
  if (
    input.trigger === "scheduled" &&
    (await wasCronDispatched(GROWTH_LOOP_JOB, input.workspaceId, periodKey))
  ) {
    return { ok: true, skipped: "already ran today" };
  }

  const snapshot = await enrichSnapshotWithBacklinks(
    toSnapshot(workspace),
    workspace.id,
  );
  const opportunities = buildGenerateContentOpportunities(snapshot);
  const pick = opportunities[0];
  if (!pick) {
    await recordCronDispatch({
      jobName: GROWTH_LOOP_JOB,
      workspaceId: input.workspaceId,
      periodKey,
      status: "skipped",
      error: "no content opportunities",
    });
    return { ok: false, error: "No content opportunities for this workspace" };
  }

  try {
    const generated = await generateWorkspaceArticle({
      topic: pick.topic,
      angle: pick.angle,
      audience: pick.audience,
      contentType: pick.format,
      pillar: pick.pillar,
      workspaceId: input.workspaceId,
    });
    if (!("post" in generated)) {
      return { ok: false, error: "Article generation did not save post" };
    }
    const { post, row } = generated;

    void ensureBlogCoverForPost(row).catch((err) => {
      console.warn(`[growth-loop cover] ${row.slug}:`, err);
    });

    let cmsUrl: string | null = null;
    let publishError: string | undefined;
    let backlinkRequested = false;
    let backlinkError: string | undefined;

    if (loop.autoPublish) {
      const provider = await resolveFirstPublishProvider(input.workspaceId);
      if (!provider) {
        publishError = "No CMS connected — connect WordPress or Webflow in Settings";
      } else {
        const published = await publishBlogPostToCms({
          workspaceId: input.workspaceId,
          row,
        });
        if (published?.liveUrl) {
          cmsUrl = published.liveUrl;
        } else {
          publishError =
            published?.error ??
            `Failed to publish to ${cmsProviderLabel(provider)}`;
        }
      }
    }

    const targetUrl = articleLiveUrl({
      cmsUrl,
      siteUrl: loop.siteUrl || workspace.domain,
      slug: post.slug,
    });

    if (loop.autoBacklinks && targetUrl) {
      const placement = await createPlacementRequest({
        workspaceId: input.workspaceId,
        userId: input.userId,
        domain: workspace.domain,
        businessType: workspace.businessType,
        competitors: workspace.competitors,
        targetUrl,
        anchorText: post.title.slice(0, 80),
        contextNote: "Growth Loop — daily SEO article",
      });
      if (placement.placement) {
        backlinkRequested = true;
      } else if (placement.error) {
        backlinkError = placement.error;
      }
    }

    const summaryParts = [`Published "${post.title}"`];
    if (cmsUrl) summaryParts.push(`live at ${cmsUrl}`);
    if (backlinkRequested) summaryParts.push("backlink queued");
    if (publishError) summaryParts.push(`publish: ${publishError}`);
    if (backlinkError) summaryParts.push(`backlink: ${backlinkError}`);

    const lastRunSummary = summaryParts.join(" · ");
    const lastRunAt = new Date().toISOString();

    await updateWorkspace(
      input.workspaceId,
      {
        preferences: mergePreferences(workspace.preferences, {
          growthLoop: { lastRunAt, lastRunSummary },
        }),
      },
      input.userId,
    );

    await recordCronDispatch({
      jobName: GROWTH_LOOP_JOB,
      workspaceId: input.workspaceId,
      periodKey,
      status: "sent",
    });

    return {
      ok: true,
      articleTitle: post.title,
      articleSlug: post.slug,
      cmsUrl,
      backlinkRequested,
      publishError,
      backlinkError,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Growth Loop failed";
    await recordCronDispatch({
      jobName: GROWTH_LOOP_JOB,
      workspaceId: input.workspaceId,
      periodKey,
      status: "failed",
      error: message,
    });
    return { ok: false, error: message };
  }
}
