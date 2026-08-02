import { NextResponse } from "next/server";
import { buildBrandAssetsZip, buildScreenshotsZip } from "@/lib/press/zip";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

const BUNDLES = {
  "brand-assets": {
    filename: "citepilot-brand-assets.zip",
    build: buildBrandAssetsZip,
  },
  screenshots: {
    filename: "citepilot-screenshots.zip",
    build: buildScreenshotsZip,
  },
} as const;

type BundleId = keyof typeof BUNDLES;

/** GET /api/press/download/brand-assets | screenshots */
export const GET = withApiLogging(async function GET(
  _request: Request,
  context: { params: Promise<{ bundle: string }> },
) {
  const { bundle } = await context.params;
  const config = BUNDLES[bundle as BundleId];
  if (!config) {
    return NextResponse.json({ error: "Unknown bundle" }, { status: 404 });
  }

  try {
    const zip = await config.build();
    if (zip.byteLength === 0) {
      return NextResponse.json({ error: "No assets available" }, { status: 503 });
    }
    return new NextResponse(Buffer.from(zip), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${config.filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("GET /api/press/download", bundle, err);
    return NextResponse.json({ error: "Could not build download" }, { status: 500 });
  }
});
