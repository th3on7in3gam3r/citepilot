import { NextResponse } from "next/server";
import { z } from "zod";
import { isEmailConfigured } from "@/lib/email/config";
import { sendEmail } from "@/lib/email/send";
import { withApiLogging } from "@/lib/observability/api-log";
import { CONSULTING_RATE_LIMIT_PER_HOUR } from "@/lib/rate-limit/constants";
import { rateLimitHeaders } from "@/lib/rate-limit/hourly";
import {
  clientIpFromRequest,
  enforceHourlyRateLimit,
} from "@/lib/rate-limit/request";
import { site } from "@/lib/site";

export const runtime = "nodejs";

const PACKAGE_LABELS: Record<string, string> = {
  "strategy-session": "GEO Strategy Session",
  "citation-rescue": "Citation Rescue Sprint",
  "agency-desk": "Agency Desk Review",
  other: "Not sure — advise me",
};

const bodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  company: z.string().trim().min(1).max(200),
  packageId: z.enum([
    "strategy-session",
    "citation-rescue",
    "agency-desk",
    "other",
  ]),
  message: z.string().trim().min(1).max(4000),
});

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
      `consulting:ip:${clientIpFromRequest(request)}`,
      CONSULTING_RATE_LIMIT_PER_HOUR,
      `Consulting inquiry limit reached (${CONSULTING_RATE_LIMIT_PER_HOUR}/hour).`,
    );
    if (rate instanceof NextResponse) return rate;

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: "Inquiry service temporarily unavailable" },
        { status: 503, headers: rateLimitHeaders(rate) },
      );
    }

    const { name, email, company, packageId, message } = parsed.data;
    const packageLabel = PACKAGE_LABELS[packageId] ?? packageId;
    const subject = `[Consulting inquiry] ${packageLabel} — ${company}`;

    const text = [
      "New consulting inquiry (human review only — do not auto-publish).",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Company/site: ${company}`,
      `Package: ${packageLabel}`,
      "",
      "Message:",
      message,
    ].join("\n");

    const html = `
      <p><strong>New consulting inquiry</strong> (human review only — do not auto-publish).</p>
      <ul>
        <li><strong>Name:</strong> ${escapeHtml(name)}</li>
        <li><strong>Email:</strong> ${escapeHtml(email)}</li>
        <li><strong>Company/site:</strong> ${escapeHtml(company)}</li>
        <li><strong>Package:</strong> ${escapeHtml(packageLabel)}</li>
      </ul>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
    `;

    const result = await sendEmail({
      to: site.supportEmail,
      replyTo: email,
      subject,
      html,
      text,
      fromName: "CitePilot Consulting",
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: "Inquiry service temporarily unavailable" },
        { status: 503, headers: rateLimitHeaders(rate) },
      );
    }

    return NextResponse.json(
      { data: { ok: true } },
      { headers: rateLimitHeaders(rate) },
    );
  } catch (error) {
    console.error("POST /api/consulting", error);
    return NextResponse.json(
      { error: "Inquiry service temporarily unavailable" },
      { status: 500 },
    );
  }
});
