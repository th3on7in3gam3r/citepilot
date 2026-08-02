import type { MonitorStatus, MonitorType } from "@/lib/uptime/types";

export type UptimeDiagnosis = {
  cause: string;
  fix: string;
};

export type DiagnoseUptimeFailureInput = {
  monitorType: MonitorType;
  status: MonitorStatus;
  statusCode?: number | null;
  message?: string | null;
  metadata?: Record<string, unknown>;
};

function parseHttpStatusFromMessage(message: string): number | null {
  const match = message.match(/\bHTTP\s+(\d{3})\b/i);
  if (!match?.[1]) return null;
  const code = Number(match[1]);
  return Number.isFinite(code) ? code : null;
}

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n));
}

/**
 * Rule-based “why down / how to fix” from check outcome fields.
 * Returns null when the monitor is healthy (`up`).
 */
export function diagnoseUptimeFailure(
  input: DiagnoseUptimeFailureInput,
): UptimeDiagnosis | null {
  if (input.status === "up") return null;

  const message = (input.message ?? "").trim();
  const lower = message.toLowerCase();
  const errorCode =
    typeof input.metadata?.errorCode === "string"
      ? input.metadata.errorCode.toLowerCase()
      : "";
  const blob = `${lower} ${errorCode}`;
  const statusCode =
    input.statusCode ?? parseHttpStatusFromMessage(message) ?? null;
  const daysLeft =
    typeof input.metadata?.daysLeft === "number"
      ? input.metadata.daysLeft
      : null;

  if (statusCode != null && statusCode >= 500) {
    return {
      cause: "The origin returned a server error (5xx).",
      fix: "Check host logs, a recent deploy, and your hosting dashboard (e.g. Render) for crashes or outages.",
    };
  }

  if (statusCode != null && statusCode >= 400) {
    return {
      cause: "The request was rejected (4xx).",
      fix: "Confirm the URL/path, auth headers, and that the expected status range matches this endpoint.",
    };
  }

  if (
    includesAny(blob, [
      "enotfound",
      "getaddrinfo",
      "err_name_not_resolved",
      "dns",
    ])
  ) {
    return {
      cause: "DNS lookup failed — the hostname could not be resolved.",
      fix: "Verify the domain’s DNS records and nameservers; wait for propagation if you just changed them.",
    };
  }

  if (includesAny(blob, ["econnrefused", "connection refused"])) {
    return {
      cause: "Nothing is accepting connections on that host/port.",
      fix: "Confirm the process is running and listening on the right port; check firewall or bind address.",
    };
  }

  if (
    includesAny(blob, [
      "timeout",
      "timed out",
      "aborted",
      "aborterror",
      "und_err_connect_timeout",
      "headers timeout",
      "body timeout",
    ])
  ) {
    return {
      cause: "The host was unreachable or too slow to respond.",
      fix: "Check DNS, firewall, cold starts, and raise the monitor timeout if the service is legitimately slow to wake.",
    };
  }

  if (input.monitorType === "ssl" || includesAny(blob, ["certificate", "ssl", "tls"])) {
    if (daysLeft != null && daysLeft < 0) {
      return {
        cause: "The TLS certificate has expired.",
        fix: "Renew the certificate (Let’s Encrypt / your host) and redeploy or force an HTTPS refresh.",
      };
    }
    if (
      (daysLeft != null && daysLeft <= 14) ||
      includesAny(blob, ["expires in", "expiring"])
    ) {
      return {
        cause: "The TLS certificate is expiring soon.",
        fix: "Renew the certificate before it expires to avoid downtime and browser warnings.",
      };
    }
    if (includesAny(blob, ["expired"])) {
      return {
        cause: "The TLS certificate has expired.",
        fix: "Renew the certificate and verify HTTPS still serves the new cert.",
      };
    }
    if (includesAny(blob, ["handshake", "no certificate"])) {
      return {
        cause: "TLS handshake failed or no certificate was returned.",
        fix: "Confirm HTTPS is configured for this host and that port 443 is open.",
      };
    }
  }

  if (input.monitorType === "keyword" || includesAny(blob, ["keyword"])) {
    return {
      cause: "The response body did not match the keyword rule.",
      fix: "Update the keyword to match the live response, or fix the app so the expected text is returned.",
    };
  }

  if (
    input.monitorType === "cron" ||
    includesAny(blob, ["cron", "last success", "no successful"])
  ) {
    return {
      cause: "The scheduled job has not reported a recent successful run.",
      fix: "Check the cron schedule, CRON_SECRET, and recent dispatch logs for failed or skipped jobs.",
    };
  }

  if (
    input.monitorType === "port" ||
    includesAny(blob, ["port", "unreachable"])
  ) {
    return {
      cause: "The TCP port did not accept a connection.",
      fix: "Open the port on the host/firewall and confirm the service is bound to that port.",
    };
  }

  if (input.status === "degraded") {
    return {
      cause: "The monitor is degraded — still reachable but not fully healthy.",
      fix: "Review the check message above and resolve the warning before it becomes a full outage.",
    };
  }

  return {
    cause: message
      ? `Check failed: ${message}`
      : "The endpoint did not pass its health check.",
    fix: "Open the URL in a browser, check hosting status, and re-run Check now after any fix.",
  };
}

export function formatUptimeDiagnosis(diagnosis: UptimeDiagnosis): string {
  return `Likely: ${diagnosis.cause} Try: ${diagnosis.fix}`;
}
