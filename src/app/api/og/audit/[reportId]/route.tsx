import { getAuditOgData } from "@/lib/audit/share";
import { renderAuditOgImage } from "@/lib/og/audit-card";

export const runtime = "nodejs";

type Params = { params: Promise<{ reportId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { reportId } = await params;
  const data = await getAuditOgData(reportId);

  if (!data) {
    return new Response("Not found", { status: 404 });
  }

  return renderAuditOgImage(data);
}
