import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { FLEET_UPGRADE_MESSAGE, userHasFleetAccess } from "@/lib/billing/access";
import { revokeFleetApiKey } from "@/lib/fleet/api-keys";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, { params }: Params) {
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (!(await userHasFleetAccess(userId))) {
    return NextResponse.json(
      { error: FLEET_UPGRADE_MESSAGE, code: "FLEET_REQUIRED" },
      { status: 403 },
    );
  }

  const { id } = await params;
  const ok = await revokeFleetApiKey(userId, id);
  if (!ok) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
