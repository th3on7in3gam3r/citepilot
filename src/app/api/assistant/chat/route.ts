import { NextResponse } from "next/server";
import { completeAssistantChat } from "@/lib/assistant/complete";
import { buildAssistantKnowledgePack } from "@/lib/assistant/knowledge";
import {
  retrieveFaqAnswer,
  stripSuggestLeadToken,
} from "@/lib/assistant/retrieve";
import { assistantChatBodySchema } from "@/lib/assistant/schema";
import { withApiLogging } from "@/lib/observability/api-log";
import { ASSISTANT_CHAT_RATE_LIMIT_PER_HOUR } from "@/lib/rate-limit/constants";
import { rateLimitHeaders } from "@/lib/rate-limit/hourly";
import {
  clientIpFromRequest,
  enforceHourlyRateLimit,
} from "@/lib/rate-limit/request";

export const runtime = "nodejs";

export const POST = withApiLogging(async function POST(request: Request) {
  try {
    const rate = await enforceHourlyRateLimit(
      `assistant-chat:ip:${clientIpFromRequest(request)}`,
      ASSISTANT_CHAT_RATE_LIMIT_PER_HOUR,
      `Assistant chat limit reached (${ASSISTANT_CHAT_RATE_LIMIT_PER_HOUR}/hour).`,
    );
    if (rate instanceof NextResponse) return rate;

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = assistantChatBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const knowledge = buildAssistantKnowledgePack();
    const lastUser = [...parsed.data.messages]
      .reverse()
      .find((m) => m.role === "user");
    const query = lastUser?.content ?? "";

    const completion = await completeAssistantChat(
      knowledge,
      parsed.data.messages,
    );

    if ("text" in completion) {
      const { reply, suggestLead } = stripSuggestLeadToken(completion.text);
      return NextResponse.json(
        { data: { reply, suggestLead } },
        { headers: rateLimitHeaders(rate) },
      );
    }

    const fallback = retrieveFaqAnswer(query, knowledge);
    return NextResponse.json(
      { data: fallback },
      { headers: rateLimitHeaders(rate) },
    );
  } catch (error) {
    console.error("POST /api/assistant/chat", error);
    return NextResponse.json(
      { error: "Assistant temporarily unavailable" },
      { status: 500 },
    );
  }
});
