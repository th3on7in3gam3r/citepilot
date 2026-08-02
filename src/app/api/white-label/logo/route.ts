import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { userHasFleetAccess } from "@/lib/billing/access";
import {
  getStoredLogo,
  MAX_LOGO_BYTES,
  resolveLogoMime,
  saveStoredLogo,
} from "@/lib/white-label/logo-store";
import { getWorkspaceById } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const GET = withApiLogging(async function GET(request: Request) {
  const workspaceId = new URL(request.url).searchParams.get("workspaceId")?.trim();
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const logo = await getStoredLogo(workspaceId);
  if (!logo) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(logo.buffer), {
    headers: {
      "Content-Type": logo.mimeType,
      "Cache-Control": "public, max-age=3600",
      "Content-Length": String(logo.sizeBytes),
    },
  });
});

export const POST = withApiLogging(async function POST(request: Request) {
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (!(await userHasFleetAccess(userId))) {
    return NextResponse.json({ error: "Fleet plan required" }, { status: 403 });
  }

  const form = await request.formData();
  const workspaceId = form.get("workspaceId")?.toString().trim();
  const file = form.get("logo");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const ws = await getWorkspaceById(workspaceId, userId);
  if (!ws) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "logo file required" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = resolveLogoMime(file, buffer);
  if (!mimeType) {
    return NextResponse.json(
      { error: "Logo must be PNG or SVG (max 500KB)" },
      { status: 400 },
    );
  }

  if (buffer.byteLength > MAX_LOGO_BYTES) {
    return NextResponse.json({ error: "Logo must be 500KB or smaller" }, { status: 400 });
  }

  const saved = await saveStoredLogo({
    workspaceId,
    mimeType,
    buffer,
  });

  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    logoUrl: `/api/white-label/logo?workspaceId=${encodeURIComponent(workspaceId)}`,
  });
});
