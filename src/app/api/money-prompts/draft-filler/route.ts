import { NextResponse, after } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth/api";
import { requireWorkspaceAccess } from "@/lib/auth/workspace-access";
import {
  PILOT_UPGRADE_MESSAGE,
  userHasPilotAccess,
} from "@/lib/billing/access";
import { ensureBlogCoverForPost } from "@/lib/blog/generate-cover";
import { generateWorkspaceArticle } from "@/lib/content/generate-workspace-article";
import type { GeneratedWorkspaceArticle } from "@/lib/content/generate-workspace-article";
import type { AudienceSegment } from "@/lib/content-strategy";
import { withApiLogging } from "@/lib/observability/api-log";
import {
  clientIpFromRequest,
  enforceHourlyRateLimit,
} from "@/lib/rate-limit/request";
import { getWorkspaceById } from "@/lib/server/workspace";
import {
  getCitationGapById,
  updateCitationGapStatus,
} from "@/lib/money-prompts/store";

export const runtime = "nodejs";
export const maxDuration = 300;

const bodySchema = z.object({
  workspaceId: z.string().min(1),
  gapId: z.string().min(1),
});

function pickAudience(audiences: string[]): AudienceSegment {
  const joined = audiences.join(" ").toLowerCase();
  if (joined.includes("agency")) return "agency";
  if (joined.includes("ecommerce") || joined.includes("e-commerce")) {
    return "ecommerce";
  }
  if (joined.includes("saas")) return "saas";
  if (joined.includes("solo") || joined.includes("founder")) {
    return "solo-founder";
  }
  return "growth-marketing";
}

function contentTypeForGap(gapReason: string | null): "comparison" | "pillar" | "tutorial" {
  if (gapReason === "no-comparison-page") return "comparison";
  if (gapReason === "weak-schema" || gapReason === "missing-llms-txt") {
    return "tutorial";
  }
  return "pillar";
}

export const POST = withApiLogging(async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY required for article generation" },
      { status: 503 },
    );
  }

  const auth = await requireApiUser(request);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.userId;
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  if (!(await userHasPilotAccess(userId))) {
    return NextResponse.json({ error: PILOT_UPGRADE_MESSAGE }, { status: 403 });
  }

  const rate = await enforceHourlyRateLimit(
    `money-prompts:draft-filler:${userId}:${clientIpFromRequest(request)}`,
    10,
    "Too many filler drafts this hour. Try again later.",
  );
  if (rate instanceof NextResponse) return rate;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const access = await requireWorkspaceAccess(
    userId,
    parsed.data.workspaceId,
    "editor",
  );
  if (!access) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const gap = await getCitationGapById(parsed.data.gapId);
  if (!gap || gap.workspaceId !== parsed.data.workspaceId) {
    return NextResponse.json({ error: "Gap not found" }, { status: 404 });
  }

  const workspace = await getWorkspaceById(parsed.data.workspaceId, userId);
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const topic = gap.query.trim() || `How to get cited for ${workspace.domain}`;
  const angle =
    gap.suggestedFix?.trim() ||
    (gap.gapReason
      ? `Close the ${gap.gapReason} citation gap for ${workspace.domain}`
      : `Help ${workspace.domain} win AI citations for this buyer query`);

  try {
    const generated = (await generateWorkspaceArticle({
      topic,
      audience: pickAudience(workspace.audiences),
      contentType: contentTypeForGap(gap.gapReason),
      angle,
      workspaceId: workspace.id,
      publish: true,
      pillar: "geo",
    })) as GeneratedWorkspaceArticle;

    await updateCitationGapStatus(gap.id, "in-progress");

    after(() => {
      void ensureBlogCoverForPost(generated.row).catch((err) => {
        console.warn(`[blog-cover] ${generated.row.slug}:`, err);
      });
    });

    return NextResponse.json({
      data: {
        postSlug: generated.post.slug,
        title: generated.post.title,
        url: `/blog/${generated.post.slug}`,
        contentStudioUrl: "/dashboard/content",
        gapStatus: "in-progress",
      },
    });
  } catch (err) {
    console.error(
      "[money-prompts/draft-filler]",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json(
      { error: "Failed to draft filler article. Try again shortly." },
      { status: 502 },
    );
  }
});
