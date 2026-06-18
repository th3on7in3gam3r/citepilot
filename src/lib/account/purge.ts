import { dbAll, dbGet, dbRun } from "@/lib/db";
import { deleteWorkspaceDependents } from "@/lib/server/workspace";
import { logComplianceEvent } from "@/lib/account/compliance-log";

const DELETED_USER_LABEL = "[deleted user]";

/** Full data purge after the cancellation window — extends admin hardDeleteUser. */
export async function purgeUserData(userId: string): Promise<void> {
  const workspaces = await dbAll<{ id: string }>(
    `SELECT id FROM workspaces WHERE user_id = ?`,
    [userId],
  );
  for (const ws of workspaces) {
    await deleteWorkspaceDependents(ws.id);
    await dbRun(`DELETE FROM workspaces WHERE id = ?`, [ws.id]);
  }

  await dbRun(
    `DELETE FROM workspace_members WHERE user_id = ? OR invited_by = ?`,
    [userId, userId],
  );
  await dbRun(`DELETE FROM user_totp WHERE user_id = ?`, [userId]);
  await dbRun(`DELETE FROM user_referrals WHERE user_id = ?`, [userId]);
  await dbRun(`DELETE FROM user_onboarding WHERE user_id = ?`, [userId]);
  await dbRun(
    `DELETE FROM referral_attributions WHERE referred_user_id = ? OR referrer_user_id = ?`,
    [userId, userId],
  );
  await dbRun(`DELETE FROM email_unsubscribes WHERE user_id = ?`, [userId]);
  await dbRun(`DELETE FROM email_sent WHERE user_id = ?`, [userId]);
  await dbRun(`DELETE FROM email_sequence_queue WHERE user_id = ?`, [userId]);
  await dbRun(`DELETE FROM slack_connections WHERE user_id = ?`, [userId]);
  await dbRun(`DELETE FROM webhook_endpoints WHERE user_id = ?`, [userId]);
  await dbRun(`DELETE FROM fleet_api_keys WHERE user_id = ?`, [userId]);
  await dbRun(`DELETE FROM cancel_survey_responses WHERE user_id = ?`, [userId]);
  await dbRun(`DELETE FROM alert_events WHERE user_id = ?`, [userId]);
  await dbRun(`DELETE FROM audit_feedback WHERE user_id = ?`, [userId]);
  await dbRun(`DELETE FROM feature_request_votes WHERE user_id = ?`, [userId]);
  await dbRun(`DELETE FROM account_export_jobs WHERE user_id = ?`, [userId]);

  await dbRun(
    `UPDATE domain_score_profiles SET claimed_by_user_id = NULL WHERE claimed_by_user_id = ?`,
    [userId],
  );

  await anonymizeAdminAuditReferences(userId);

  const billing = await dbGet<{ stripe_customer_id: string | null }>(
    `SELECT stripe_customer_id FROM billing_accounts WHERE user_id = ?`,
    [userId],
  );

  await dbRun(`DELETE FROM billing_accounts WHERE user_id = ?`, [userId]);

  await logComplianceEvent({
    userId,
    action: "gdpr_purge_completed",
    metadata: {
      stripeCustomerIdRetained: billing?.stripe_customer_id ?? null,
    },
  });
}

async function anonymizeAdminAuditReferences(userId: string): Promise<void> {
  await dbRun(
    `UPDATE admin_audit_log
     SET admin_email = ?, target_user_id = NULL
     WHERE admin_id = ?`,
    [DELETED_USER_LABEL, userId],
  );
  await dbRun(
    `UPDATE admin_audit_log SET target_user_id = NULL WHERE target_user_id = ?`,
    [userId],
  );
}
