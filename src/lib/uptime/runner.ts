import { createHmac } from "crypto";
import { decryptWebhookSecret, recordAlertEvent } from "@/lib/alerts/store";
import { postSlackMessage } from "@/lib/alerts/slack-client";
import { getSlackConnection, listWebhookEndpoints } from "@/lib/alerts/store";
import { runMonitorCheck } from "@/lib/uptime/checks";
import {
  getMonitorAuthForRun,
  listDueMonitors,
  recordCheckResult,
} from "@/lib/uptime/store";
import type { MonitorStatus, UptimeMonitor } from "@/lib/uptime/types";
import { getWorkspaceById } from "@/lib/server/workspace";

async function notifyMonitorEvent(input: {
  monitor: UptimeMonitor;
  userId: string;
  previousStatus: MonitorStatus;
  currentStatus: MonitorStatus;
  message: string;
}): Promise<void> {
  const wasHealthy =
    input.previousStatus === "up" || input.previousStatus === "degraded";
  const isHealthy =
    input.currentStatus === "up" || input.currentStatus === "degraded";

  const recovered = !wasHealthy && isHealthy;
  const failed = wasHealthy && input.currentStatus === "down";

  if (!recovered && !failed) return;

  const ws = await getWorkspaceById(input.monitor.workspaceId, input.userId);
  const domain = ws?.domain ?? input.monitor.workspaceId;
  const title = recovered
    ? `Monitor recovered: ${input.monitor.name}`
    : `Monitor down: ${input.monitor.name}`;
  const description = `${input.monitor.monitorType.toUpperCase()} · ${input.monitor.url} — ${input.message}`;

  await recordAlertEvent({
    userId: input.userId,
    workspaceId: input.monitor.workspaceId,
    channel: "webhook",
    eventType: recovered ? "uptime.recovered" : "uptime.down",
    title,
    description,
    metadata: {
      monitorId: input.monitor.id,
      monitorType: input.monitor.monitorType,
      url: input.monitor.url,
      status: input.currentStatus,
    },
  });

  const slack = await getSlackConnection(
    input.monitor.workspaceId,
    input.userId,
  );
  if (slack?.slack_channel_id) {
    await postSlackMessage({
      connection: slack,
      text: `${title}\n${description}`,
      blocks: [],
    }).catch(() => undefined);
  }

  const payload = {
    event: recovered ? "uptime.recovered" : "uptime.down",
    monitor_id: input.monitor.id,
    monitor_name: input.monitor.name,
    monitor_type: input.monitor.monitorType,
    url: input.monitor.url,
    workspace_id: input.monitor.workspaceId,
    workspace_domain: domain,
    status: input.currentStatus,
    message: input.message,
    timestamp: new Date().toISOString(),
  };

  const webhooks = await listWebhookEndpoints(
    input.monitor.workspaceId,
    input.userId,
  );
  for (const endpoint of webhooks) {
    try {
      const secret = decryptWebhookSecret(endpoint);
      const body = JSON.stringify(payload);
      const signature = createHmac("sha256", secret).update(body).digest("hex");
      await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CitePilot-Signature": `sha256=${signature}`,
        },
        body,
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      // best-effort webhook delivery
    }
  }
}

export async function runSingleMonitor(
  monitor: UptimeMonitor,
  userId: string,
): Promise<void> {
  const previousStatus = monitor.lastStatus;
  const auth = await getMonitorAuthForRun(monitor);
  const outcome = await runMonitorCheck(monitor, auth);

  await recordCheckResult({
    monitorId: monitor.id,
    status: outcome.status,
    latencyMs: outcome.latencyMs,
    statusCode: outcome.statusCode,
    message: outcome.message,
    metadata: outcome.metadata,
  });

  await notifyMonitorEvent({
    monitor,
    userId,
    previousStatus,
    currentStatus: outcome.status,
    message: outcome.message ?? outcome.status,
  });
}

export async function runDueUptimeChecks(limit = 40): Promise<{
  checked: number;
  up: number;
  down: number;
  degraded: number;
}> {
  const due = await listDueMonitors(limit);
  let up = 0;
  let down = 0;
  let degraded = 0;

  for (const item of due) {
    const previousStatus = item.lastStatus;
    const outcome = await runMonitorCheck(item, item.auth);
    await recordCheckResult({
      monitorId: item.id,
      status: outcome.status,
      latencyMs: outcome.latencyMs,
      statusCode: outcome.statusCode,
      message: outcome.message,
      metadata: outcome.metadata,
    });

    if (outcome.status === "up") up += 1;
    else if (outcome.status === "down") down += 1;
    else if (outcome.status === "degraded") degraded += 1;

    await notifyMonitorEvent({
      monitor: item,
      userId: item.userId,
      previousStatus,
      currentStatus: outcome.status,
      message: outcome.message ?? outcome.status,
    }).catch(() => undefined);
  }

  return { checked: due.length, up, down, degraded };
}
