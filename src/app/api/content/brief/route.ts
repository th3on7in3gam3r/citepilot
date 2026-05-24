import { NextResponse } from "next/server";
import { buildArticleBrief } from "@/lib/content-strategy";
import type { ArticleBriefInput } from "@/lib/content-strategy";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ArticleBriefInput>;
    if (!body.topic?.trim()) {
      return NextResponse.json({ error: "topic is required" }, { status: 400 });
    }
    if (!body.audience || !body.contentType) {
      return NextResponse.json(
        { error: "audience and contentType are required" },
        { status: 400 },
      );
    }

    const brief = buildArticleBrief({
      topic: body.topic.trim(),
      audience: body.audience,
      contentType: body.contentType,
      angle: body.angle,
    });

    return NextResponse.json({ brief });
  } catch (error) {
    console.error("POST /api/content/brief", error);
    return NextResponse.json({ error: "Failed to build brief" }, { status: 500 });
  }
}
