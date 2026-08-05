import { NextResponse } from "next/server";
import { insertAssistantLeadDraft } from "@/lib/assistant/leads";
import { assistantLeadBodySchema } from "@/lib/assistant/schema";
import { isEmailConfigured } from "@/lib/email/config";
import { sendEmail } from "@/lib/email/send";
import { withApiLogging } from "@/lib/observability/api-log";
import { ASSISTANT_LEAD_RATE_LIMIT_PER_HOUR } from "@/lib/rate-limit/constants";
import { rateLimitHeaders } from "@/lib/rate-limit/hourly";
import {
  clientIpFromRequest,
  enforceHourlyRateLimit,
} from "@/lib/rate-limit/request";
import { site } from "@/lib/site";

export const runtime = "nodejs";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const POST = withApiLogging(async function POST(request: Request) {
  try {
    const rate = await enforceHourlyRateLimit(
      `assistant-lead:ip:${clientIpFromRequest(request)}`,
      ASSISTANT_LEAD_RATE_LIMIT_PER_HOUR,
      `Assistant lead limit reached (${ASSISTANT_LEAD_RATE_LIMIT_PER_HOUR}/hour).`,
    );
    if (rate instanceof NextResponse) return rate;

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = assistantLeadBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const { name, email, company, intent, transcript, locale } = parsed.data;
    const companyValue = company?.trim() || null;
    const transcriptValue = transcript?.trim() || null;

    let draftId: string | null = null;
    let persisted = false;
    try {
      const row = await insertAssistantLeadDraft({
        name,
        email,
        company: companyValue,
        intent,
        transcript: transcriptValue,
        locale: locale?.trim() || null,
      });
      draftId = row.id;
      persisted = true;
    } catch (err) {
      console.error("[assistant] lead draft persist failed", err);
    }

    let emailed = false;
    if (isEmailConfigured()) {
      const subject = `[Assistant lead draft] ${companyValue ?? name}`;
      const text = [
        "New site assistant lead draft (human review only — do not auto-publish to CRM).",
        "",
        `Draft id: ${draftId ?? "(not persisted)"}`,
        `Name: ${name}`,
        `Email: ${email}`,
        `Company: ${companyValue ?? "(none)"}`,
        `Locale: ${locale ?? "en"}`,
        "",
        "Intent:",
        intent,
        "",
        "Transcript excerpt:",
        transcriptValue ?? "(none)",
      ].join("\n");

      const html = `
        <p><strong>New site assistant lead draft</strong> (human review only — do not auto-publish to CRM).</p>
        <ul>
          <li><strong>Draft id:</strong> ${escapeHtml(draftId ?? "(not persisted)")}</li>
          <li><strong>Name:</strong> ${escapeHtml(name)}</li>
          <li><strong>Email:</strong> ${escapeHtml(email)}</li>
          <li><strong>Company:</strong> ${escapeHtml(companyValue ?? "(none)")}</li>
          <li><strong>Locale:</strong> ${escapeHtml(locale ?? "en")}</li>
        </ul>
        <p><strong>Intent:</strong></p>
        <p>${escapeHtml(intent).replace(/\n/g, "<br/>")}</p>
        <p><strong>Transcript excerpt:</strong></p>
        <p>${escapeHtml(transcriptValue ?? "(none)").replace(/\n/g, "<br/>")}</p>
      `;

      const result = await sendEmail({
        to: site.supportEmail,
        replyTo: email,
        subject,
        html,
        text,
        fromName: "CitePilot Assistant",
      });
      emailed = result.ok;
      if (!result.ok) {
        console.error("[assistant] lead review email failed");
      }
    }

    if (!persisted && !emailed) {
      return NextResponse.json(
        { error: "Lead service temporarily unavailable" },
        { status: 503, headers: rateLimitHeaders(rate) },
      );
    }

    return NextResponse.json(
      { data: { ok: true, draftId, emailed } },
      { headers: rateLimitHeaders(rate) },
    );
  } catch (error) {
    console.error("POST /api/assistant/lead", error);
    return NextResponse.json(
      { error: "Lead service temporarily unavailable" },
      { status: 500 },
    );
  }
});
