import { NextResponse } from "next/server";
import {
  getFeatureRequestById,
  updateFeatureRequestStatus,
  type FeatureRequestStatus,
} from "@/lib/feedback/store";
import { notifyFeatureRequestStatusChange } from "@/lib/feedback/notifications";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

const VALID_STATUSES = new Set<FeatureRequestStatus>([
  "under_review",
  "planned",
  "in_progress",
  "shipped",
]);

type Params = { params: Promise<{ id: string }> };

export const PATCH = withApiLogging(async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as { status?: FeatureRequestStatus };
  const status = body.status;

  if (!status || !VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const before = await getFeatureRequestById(id);
  if (!before) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await updateFeatureRequestStatus(id, status);
  if (!updated) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  if (
    before.status !== status &&
    updated.submitterEmail &&
    (status === "planned" || status === "in_progress" || status === "shipped")
  ) {
    await notifyFeatureRequestStatusChange({
      to: updated.submitterEmail,
      title: updated.title,
      status,
    });
  }

  return NextResponse.json({ request: updated });
});
