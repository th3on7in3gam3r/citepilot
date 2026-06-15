import { NextResponse } from "next/server";
import { requireCronAuth } from "@/lib/cron/auth";
import { triggerEmailSequence } from "@/lib/email/sequences/engine";
import type {
  EmailSequenceName,
  SendSequenceInput,
  SequenceEmailPayload,
} from "@/lib/email/sequences/types";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

const VALID_SEQUENCES: EmailSequenceName[] = [
  "free_onboarding",
  "post_audit",
  "pilot_retention",
  "churn_prevention",
];

/** POST /api/email/send — trigger a sequence email (cron / internal). */
export const POST = withApiLogging(async function POST(request: Request) {
  const auth = requireCronAuth(request);
  if (auth) return auth;

  const body = (await request.json()) as Partial<SendSequenceInput>;
  if (!body.userId?.trim() || !body.sequence) {
    return NextResponse.json(
      { error: "userId and sequence are required" },
      { status: 400 },
    );
  }
  if (!VALID_SEQUENCES.includes(body.sequence as EmailSequenceName)) {
    return NextResponse.json({ error: "Invalid sequence" }, { status: 400 });
  }

  const result = await triggerEmailSequence({
    sequence: body.sequence as EmailSequenceName,
    userId: body.userId.trim(),
    data: body.data as SequenceEmailPayload | undefined,
    emailNumber: body.emailNumber,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 503 });
  }

  return NextResponse.json(result);
});
