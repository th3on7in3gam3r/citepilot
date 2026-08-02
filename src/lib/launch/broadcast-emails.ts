import { dbAll } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { renderSequenceEmail } from "@/lib/email/sequences/templates";
import {
  hasEmailBeenSent,
  isEmailUnsubscribed,
  recordEmailSent,
} from "@/lib/email/sequences/store";

export async function broadcastProductHuntEmail(
  sequence: "ph_prelaunch" | "ph_launch_day",
): Promise<{ sent: number; skipped: number; failed: number }> {
  const rows = await dbAll<{ user_id: string; email: string }>(
    `SELECT DISTINCT user_id, email FROM user_referrals
     WHERE email IS NOT NULL AND TRIM(email) != ''`,
  );

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    if (await isEmailUnsubscribed(row.user_id)) {
      skipped += 1;
      continue;
    }
    if (await hasEmailBeenSent(row.user_id, sequence, 1)) {
      skipped += 1;
      continue;
    }

    const rendered = renderSequenceEmail(row.user_id, sequence, 1, {
      userName: row.email.split("@")[0],
    });
    if (!rendered) {
      skipped += 1;
      continue;
    }

    const result = await sendEmail({
      to: row.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });

    if (result.ok) {
      await recordEmailSent({
        userId: row.user_id,
        sequence,
        emailNumber: 1,
        resendId: result.id ?? null,
      });
      sent += 1;
    } else {
      failed += 1;
    }
  }

  return { sent, skipped, failed };
}
