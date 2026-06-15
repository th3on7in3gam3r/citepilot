import { userHasPilotAccess } from "@/lib/billing/access";
import { getBillingByUserId } from "@/lib/billing/store";
import { isActiveBillingStatus } from "@/lib/billing/types";
import { isEmailConfigured } from "@/lib/email/config";
import { resolveUserEmail } from "@/lib/email/recipient";
import { sendEmail } from "@/lib/email/send";
import { SEQUENCE_SCHEDULES } from "./constants";
import {
  cancelPendingQueue,
  countMonitoredPrompts,
  countUserAudits,
  getLatestAuditScore,
  hasEmailBeenSent,
  isEmailUnsubscribed,
  listDueQueueItems,
  markQueueCancelled,
  markQueueSent,
  queueSequenceEmail,
  recordEmailSent,
  userHasCompletedAudit,
} from "./store";
import {
  classifyGapFixType,
  renderPilotValueRecap,
  renderPilotWeekCheckIn,
  renderSequenceEmail,
} from "./templates";
import type {
  EmailSequenceName,
  SendSequenceInput,
  SequenceEmailPayload,
} from "./types";

function scheduleFromNow(days: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

async function shouldSkipEmail(
  userId: string,
  sequence: EmailSequenceName,
  emailNumber: number,
  payload: SequenceEmailPayload,
): Promise<boolean> {
  if (await isEmailUnsubscribed(userId)) return true;
  if (await hasEmailBeenSent(userId, sequence, emailNumber)) return true;

  if (sequence === "free_onboarding") {
    if (emailNumber === 2 && (await userHasCompletedAudit(userId))) return true;
    if (emailNumber === 3) {
      const hasAudit = await userHasCompletedAudit(userId);
      const paid = await userHasPilotAccess(userId);
      if (!hasAudit || paid) return true;
    }
  }

  if (sequence === "churn_prevention" && emailNumber === 2) {
    const billing = await getBillingByUserId(userId);
    if (billing && isActiveBillingStatus(billing.status)) return true;
  }

  void payload;
  return false;
}

async function deliverEmail(
  userId: string,
  to: string,
  sequence: EmailSequenceName,
  emailNumber: number,
  payload: SequenceEmailPayload,
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (await shouldSkipEmail(userId, sequence, emailNumber, payload)) {
    return { ok: true, skipped: true };
  }

  let rendered = renderSequenceEmail(userId, sequence, emailNumber, payload);

  if (sequence === "pilot_retention" && emailNumber === 2) {
    const promptCount = await countMonitoredPrompts(userId);
    rendered = renderPilotWeekCheckIn(userId, { ...payload, promptCount });
  }

  if (sequence === "pilot_retention" && emailNumber === 3) {
    rendered = renderPilotValueRecap(userId, {
      promptCount: await countMonitoredPrompts(userId),
      scanCount: await countUserAudits(userId),
      latestScore: await getLatestAuditScore(userId),
      userName: payload.userName,
    });
  }

  if (!rendered) {
    return { ok: false, error: "Unknown sequence email" };
  }

  const result = await sendEmail({
    to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  await recordEmailSent({
    userId,
    sequence,
    emailNumber,
    resendId: result.id ?? null,
  });

  return { ok: true };
}

/** Start or send one email in a sequence. */
export async function triggerEmailSequence(
  input: SendSequenceInput,
): Promise<{ ok: boolean; queued: number; sent: number; error?: string }> {
  if (!isEmailConfigured()) {
    return { ok: false, queued: 0, sent: 0, error: "Email not configured" };
  }

  const to = await resolveUserEmail(input.userId);
  if (!to) {
    return { ok: false, queued: 0, sent: 0, error: "No email for user" };
  }

  const payload = input.data ?? {};
  const schedule = SEQUENCE_SCHEDULES[input.sequence];
  const entries = input.emailNumber
    ? schedule.filter((e) => e.emailNumber === input.emailNumber)
    : schedule;

  if (entries.length === 0) {
    return { ok: false, queued: 0, sent: 0, error: "Invalid email number" };
  }

  let queued = 0;
  let sent = 0;

  for (const entry of entries) {
    if (entry.delayDays === 0) {
      const result = await deliverEmail(
        input.userId,
        to,
        input.sequence,
        entry.emailNumber,
        payload,
      );
      if (result.ok && !result.skipped) sent += 1;
    } else {
      if (!(await hasEmailBeenSent(input.userId, input.sequence, entry.emailNumber))) {
        await queueSequenceEmail({
          userId: input.userId,
          sequence: input.sequence,
          emailNumber: entry.emailNumber,
          scheduledAt: scheduleFromNow(entry.delayDays),
          payload,
        });
        queued += 1;
      }
    }
  }

  return { ok: true, queued, sent };
}

export async function processEmailSequenceQueue(): Promise<{
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
}> {
  const due = await listDueQueueItems(50);
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of due) {
    const sequence = item.sequence_name as EmailSequenceName;
    const to = await resolveUserEmail(item.user_id);
    if (!to) {
      await markQueueCancelled(item.id);
      skipped += 1;
      continue;
    }

    const result = await deliverEmail(
      item.user_id,
      to,
      sequence,
      item.email_number,
      item.payloadParsed,
    );

    if (result.ok) {
      await markQueueSent(item.id);
      if (result.skipped) skipped += 1;
      else sent += 1;
    } else {
      failed += 1;
    }
  }

  return { processed: due.length, sent, skipped, failed };
}

export async function triggerFreeOnboarding(
  userId: string,
  email?: string | null,
): Promise<void> {
  if (email) {
    const { cacheUserEmail } = await import("@/lib/email/recipient");
    await cacheUserEmail(userId, email);
  }
  if (await hasEmailBeenSent(userId, "free_onboarding", 1)) return;
  await triggerEmailSequence({ sequence: "free_onboarding", userId });
}

export async function triggerPostAuditSequence(input: {
  userId: string;
  email?: string | null;
  domain: string;
  workspaceId: string;
  auditId: string;
  score: number;
  cited: number;
  total: number;
  gaps: string[];
  shareUrl?: string;
}): Promise<void> {
  if (input.email) {
    const { cacheUserEmail } = await import("@/lib/email/recipient");
    await cacheUserEmail(input.userId, input.email);
  }

  const topGap = input.gaps[0] ?? "Add structured data and answer capsules on key pages";
  await triggerEmailSequence({
    sequence: "post_audit",
    userId: input.userId,
    data: {
      domain: input.domain,
      workspaceId: input.workspaceId,
      auditId: input.auditId,
      score: input.score,
      cited: input.cited,
      total: input.total,
      topGap,
      gapFixType: classifyGapFixType(topGap),
      shareUrl: input.shareUrl,
    },
  });
}

export async function triggerPilotRetention(
  userId: string,
  email?: string | null,
): Promise<void> {
  if (email) {
    const { cacheUserEmail } = await import("@/lib/email/recipient");
    await cacheUserEmail(userId, email);
  }
  await cancelPendingQueue(userId, "free_onboarding");
  if (await hasEmailBeenSent(userId, "pilot_retention", 1)) return;
  await triggerEmailSequence({ sequence: "pilot_retention", userId });
}

export async function triggerChurnPrevention(
  userId: string,
  email?: string | null,
): Promise<void> {
  if (email) {
    const { cacheUserEmail } = await import("@/lib/email/recipient");
    await cacheUserEmail(userId, email);
  }
  if (await hasEmailBeenSent(userId, "churn_prevention", 1)) return;
  await triggerEmailSequence({ sequence: "churn_prevention", userId });
}
