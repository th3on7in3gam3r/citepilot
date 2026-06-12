import { NextResponse } from "next/server";
import { buildGeoSnippetJavaScript } from "@/lib/geo/snippet";
import { parsePreferences } from "@/lib/settings";
import { dbGet } from "@/lib/db";

export const runtime = "nodejs";

type Params = { params: Promise<{ workspaceId: string }> };

function normalizeWorkspaceId(raw: string): string {
  return raw.replace(/\.js$/i, "").trim();
}

export async function GET(_request: Request, { params }: Params) {
  const { workspaceId: rawId } = await params;
  const workspaceId = normalizeWorkspaceId(rawId);

  const row = await dbGet<{ domain: string; preferences: string | null }>(
    `SELECT domain, preferences FROM workspaces WHERE id = ?`,
    [workspaceId],
  );

  if (!row?.domain) {
    return new NextResponse("/* CitePilot GEO snippet — workspace not found */", {
      status: 404,
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  }

  const preferences = parsePreferences(row.preferences);
  const enabledFixes =
    preferences.geoSnippetFixes.length > 0
      ? preferences.geoSnippetFixes
      : preferences.appliedFixes;

  const body = buildGeoSnippetJavaScript({
    domain: row.domain,
    enabledFixes,
  });

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
