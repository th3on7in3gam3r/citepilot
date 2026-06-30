import type { AuditPayload } from "@/lib/api-types";
import { buildScanDeltaSummary } from "@/lib/audit/scan-delta";
import { getRecentAuditsForWorkspace } from "@/lib/audit/run-audit";
import { userHasPilotAccess } from "@/lib/billing/access";
import { completeCopilot } from "@/lib/copilot/complete";
import { buildCopilotContext } from "@/lib/copilot/workspace-context";
import {
  attachSerpToContextJson,
  fetchSerpContext,
} from "@/lib/search/serp-context";
import {
  buildPrioritizeUserMessage,
  COPILOT_SYSTEM_PROMPT,
} from "@/lib/copilot/prompts";
import {
  cronPeriodKey,
  recordCronDispatch,
  wasCronDispatched,
} from "@/lib/cron/dispatch-log";
import { sendAutopilotReportEmail } from "@/lib/email/autopilot-report";
import { isEmailConfigured } from "@/lib/email/config";
import { trackServerEvent } from "@/lib/analytics/track-server";
import { parsePreferences } from "@/lib/settings";
import {
  enrichSnapshotWithBacklinks,
  getWorkspaceById,
  toSnapshot,
} from "@/lib/server/workspace";

export const AUTOPILOT_JOB = "workspace-autopilot";

export type AutopilotRunResult = {
  ok: boolean;
  error?: string;
  warning?: string;
  insightGenerated?: boolean;
  emailSent?: boolean;
  skipped?: string;
};

function recipientFromPrefs(
  preferences: ReturnType<typeof parsePreferences>,
): string | null {
  return preferences.monitoringEmail?.trim() || null;
}

/** Run Insights + optional email after a scan (scheduled or manual). */
export async function runAutopilotForWorkspace(input: {
  workspaceId: string;
  userId: string;
  audit: AuditPayload;
  trigger: "scheduled" | "manual";
  competitors?: string[];
}): Promise<AutopilotRunResult> {
  const paid = await userHasPilotAccess(input.userId);
  if (!paid) {
    return { ok: false, error: "Pilot or Fleet required for Autopilot" };
  }

  const workspace = await getWorkspaceById(input.workspaceId, input.userId);
  if (!workspace) {
    return { ok: false, error: "Workspace not found" };
  }

  const prefs = workspace.preferences;
  if (input.trigger === "scheduled" && !prefs.autopilot.enabled) {
    return { ok: true, skipped: "autopilot disabled" };
  }

  const periodKey = cronPeriodKey(AUTOPILOT_JOB, new Date());
  if (
    input.trigger === "scheduled" &&
    (await wasCronDispatched(AUTOPILOT_JOB, input.workspaceId, periodKey))
  ) {
    return { ok: true, skipped: "already ran this week" };
  }

  const competitors =
    input.competitors ?? workspace.competitors ?? input.audit.competitors;

  const recent = await getRecentAuditsForWorkspace(input.workspaceId, 2);
  const previous =
    recent.find((a) => a.id !== input.audit.id) ?? recent[1] ?? null;
  const scanDelta = buildScanDeltaSummary({
    current: input.audit,
    previous,
    trackedCompetitors: competitors,
  });

  let insightText: string | null = null;
  let insightGenerated = false;

  if (prefs.autopilot.autoInsights) {
    const snapshot = await enrichSnapshotWithBacklinks(
      toSnapshot(workspace),
      workspace.id,
    );

    if (snapshot.hasRealAudit) {
      const serp = await fetchSerpContext(snapshot);
      const contextJson = attachSerpToContextJson(
        buildCopilotContext(snapshot),
        serp,
      );
      const result = await completeCopilot(
        COPILOT_SYSTEM_PROMPT,
        buildPrioritizeUserMessage(contextJson),
        900,
      );
      if ("text" in result) {
        insightText = result.text;
        insightGenerated = true;
      }
    }
  }

  let emailSent = false;
  const to = recipientFromPrefs(prefs);
  if (prefs.autopilot.emailReport && to && isEmailConfigured()) {
    const sendResult = await sendAutopilotReportEmail({
      domain: input.audit.domain,
      to,
      audit: input.audit,
      workspaceId: input.workspaceId,
      userId: input.userId,
      scanDelta,
      insightText,
    });
    emailSent = sendResult.ok;
    if (!sendResult.ok) {
      const warning = sendResult.error ?? "Autopilot email failed";
      try {
        await recordCronDispatch({
          jobName: AUTOPILOT_JOB,
          workspaceId: input.workspaceId,
          periodKey,
          status: "failed",
          error: warning,
        });
      } catch (err) {
        console.error("[autopilot] recordCronDispatch failed", err);
      }
      // Do not fail the whole Autopilot run on email provider issues.
      // Insights + scan processing can still succeed.
      return { ok: true, warning, insightGenerated, emailSent: false };
    }
  }

  try {
    await recordCronDispatch({
      jobName: AUTOPILOT_JOB,
      workspaceId: input.workspaceId,
      periodKey,
      status: "sent",
      error: `trigger=${input.trigger};insight=${insightGenerated};email=${emailSent}`,
    });
  } catch (err) {
    console.error("[autopilot] recordCronDispatch failed", err);
  }

  void trackServerEvent("autopilot_run", {
    distinctId: input.userId,
    workspaceId: input.workspaceId,
    trigger: input.trigger,
    insightGenerated,
    emailSent,
  });

  return { ok: true, insightGenerated, emailSent };
}
