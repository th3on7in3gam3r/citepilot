import { NextResponse } from "next/server";
import { requireApiUser, requireApiUserId } from "@/lib/auth/api";
import { getSessionUser, getSessionUserId } from "@/lib/auth/server";
import { runCitationAudit } from "@/lib/audit/run-audit";
import { sendAuditCompleteEmail } from "@/lib/email/notifications";
import { getWorkspaceById } from "@/lib/server/workspace";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      domain?: string;
      prompts?: string[];
      workspaceId?: string;
    };

    const domain = body.domain?.trim();
    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }

    const prompts =
      body.prompts?.map((p) => p.trim()).filter(Boolean) ?? [];
    if (prompts.length === 0) {
      return NextResponse.json(
        { error: "At least one prompt is required" },
        { status: 400 },
      );
    }

    let competitors: string[] = [];
    let userId: string | null = await getSessionUserId();

    if (body.workspaceId) {
      const user = await requireApiUser(request);
      const uid = requireApiUserId(user);
      if (uid instanceof NextResponse) return uid;
      userId = uid;
      const ws = await getWorkspaceById(body.workspaceId, userId);
      if (!ws) {
        return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
      }
      competitors = ws.competitors;
    }

    const audit = await runCitationAudit({
      domain,
      prompts,
      workspaceId: body.workspaceId ?? null,
      competitors,
    });

    if (body.workspaceId) {
      const sessionUser = await getSessionUser(request);
      void sendAuditCompleteEmail({
        workspaceId: body.workspaceId,
        audit,
        userEmail: sessionUser?.email,
      }).catch((err) => console.error("Audit email failed", err));
    }

    return NextResponse.json(audit);
  } catch (error) {
    console.error("POST /api/audit", error);
    return NextResponse.json({ error: "Audit failed" }, { status: 500 });
  }
}
