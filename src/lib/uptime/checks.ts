import { connect as tlsConnect } from "tls";
import { connect as netConnect } from "net";
import { dbGet } from "@/lib/db";
import { fetchWithAuth } from "@/lib/uptime/auth-headers";
import type {
  CheckOutcome,
  MonitorStatus,
  UptimeAuthConfig,
  UptimeMonitor,
} from "@/lib/uptime/types";

function parseHost(input: string): { host: string; port: number; https: boolean } {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    const url = new URL(trimmed);
    return {
      host: url.hostname,
      port: url.port
        ? Number(url.port)
        : url.protocol === "https:"
          ? 443
          : 80,
      https: url.protocol === "https:",
    };
  }
  const [host, portPart] = trimmed.split(":");
  return {
    host: host ?? trimmed,
    port: portPart ? Number(portPart) : 443,
    https: true,
  };
}

async function checkHttpLike(
  monitor: UptimeMonitor,
  auth: UptimeAuthConfig | null,
): Promise<CheckOutcome> {
  const started = Date.now();
  const method =
    monitor.monitorType === "ping"
      ? "HEAD"
      : (monitor.method || "GET").toUpperCase();

  try {
    const res = await fetchWithAuth(
      monitor.url,
      { method, timeoutMs: monitor.timeoutMs },
      monitor.authType,
      auth,
      monitor.headers,
    );
    const latencyMs = Date.now() - started;
    const statusCode = res.status;
    const inRange =
      statusCode >= monitor.expectedStatusMin &&
      statusCode <= monitor.expectedStatusMax;

    if (monitor.monitorType === "keyword") {
      const body = await res.text();
      const keyword = monitor.keyword?.trim() ?? "";
      const found = keyword
        ? body.toLowerCase().includes(keyword.toLowerCase())
        : true;
      const keywordOk = monitor.keywordPresent ? found : !found;
      if (!inRange) {
        return {
          status: "down",
          latencyMs,
          statusCode,
          message: `HTTP ${statusCode} outside expected range`,
        };
      }
      if (!keywordOk) {
        return {
          status: "down",
          latencyMs,
          statusCode,
          message: monitor.keywordPresent
            ? `Keyword "${keyword}" not found in response`
            : `Keyword "${keyword}" should not appear in response`,
        };
      }
      return {
        status: "up",
        latencyMs,
        statusCode,
        message: `HTTP ${statusCode} · keyword OK`,
        metadata: { keywordMatched: found },
      };
    }

    if (!inRange) {
      return {
        status: "down",
        latencyMs,
        statusCode,
        message: `HTTP ${statusCode} outside expected range ${monitor.expectedStatusMin}–${monitor.expectedStatusMax}`,
      };
    }

    return {
      status: "up",
      latencyMs,
      statusCode,
      message: `HTTP ${statusCode}`,
    };
  } catch (error) {
    return {
      status: "down",
      latencyMs: Date.now() - started,
      statusCode: null,
      message: error instanceof Error ? error.message : "Request failed",
    };
  }
}

async function checkSsl(monitor: UptimeMonitor): Promise<CheckOutcome> {
  const started = Date.now();
  const { host, port } = parseHost(monitor.url);

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      socket.destroy();
      resolve({
        status: "down",
        latencyMs: Date.now() - started,
        statusCode: null,
        message: "SSL handshake timed out",
      });
    }, monitor.timeoutMs);

    const socket = tlsConnect(
      { host, port: port || 443, servername: host, rejectUnauthorized: false },
      () => {
        clearTimeout(timer);
        const cert = socket.getPeerCertificate();
        socket.end();
        const latencyMs = Date.now() - started;

        if (!cert || !cert.valid_to) {
          resolve({
            status: "down",
            latencyMs,
            statusCode: null,
            message: "No certificate returned",
          });
          return;
        }

        const expires = new Date(cert.valid_to);
        const daysLeft = Math.floor(
          (expires.getTime() - Date.now()) / (86400 * 1000),
        );
        const warnDays = monitor.sslWarnDays || 14;

        if (daysLeft < 0) {
          resolve({
            status: "down",
            latencyMs,
            statusCode: null,
            message: `Certificate expired ${Math.abs(daysLeft)} days ago`,
            metadata: { expiresAt: expires.toISOString(), daysLeft },
          });
          return;
        }

        if (daysLeft <= warnDays) {
          resolve({
            status: "degraded",
            latencyMs,
            statusCode: null,
            message: `Certificate expires in ${daysLeft} days`,
            metadata: { expiresAt: expires.toISOString(), daysLeft },
          });
          return;
        }

        resolve({
          status: "up",
          latencyMs,
          statusCode: null,
          message: `Certificate valid · ${daysLeft} days remaining`,
          metadata: { expiresAt: expires.toISOString(), daysLeft },
        });
      },
    );

    socket.on("error", (error) => {
      clearTimeout(timer);
      resolve({
        status: "down",
        latencyMs: Date.now() - started,
        statusCode: null,
        message: error.message,
      });
    });
  });
}

async function checkPort(monitor: UptimeMonitor): Promise<CheckOutcome> {
  const started = Date.now();
  const { host } = parseHost(monitor.url);
  const port = monitor.port ?? parseHost(monitor.url).port;

  return new Promise((resolve) => {
    const socket = netConnect({ host, port, timeout: monitor.timeoutMs }, () => {
      socket.end();
      resolve({
        status: "up",
        latencyMs: Date.now() - started,
        statusCode: null,
        message: `Port ${port} open on ${host}`,
      });
    });

    socket.on("error", (error) => {
      resolve({
        status: "down",
        latencyMs: Date.now() - started,
        statusCode: null,
        message: error.message,
      });
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve({
        status: "down",
        latencyMs: Date.now() - started,
        statusCode: null,
        message: `Port ${port} unreachable on ${host}`,
      });
    });
  });
}

async function checkCron(
  monitor: UptimeMonitor,
  auth: UptimeAuthConfig | null,
): Promise<CheckOutcome> {
  const httpResult = await checkHttpLike(monitor, auth);
  if (httpResult.status === "down") return httpResult;

  const jobName = monitor.cronJobName?.trim();
  if (!jobName) return httpResult;

  const row = await dbGet<{ created_at: string; status: string }>(
    `SELECT created_at, status FROM cron_dispatch_log
     WHERE job_name = ? AND status = 'ok'
     ORDER BY created_at DESC LIMIT 1`,
    [jobName],
  );

  if (!row) {
    return {
      status: "degraded",
      latencyMs: httpResult.latencyMs,
      statusCode: httpResult.statusCode,
      message: `Endpoint OK but no successful cron run logged for "${jobName}"`,
    };
  }

  const ageMs = Date.now() - new Date(row.created_at).getTime();
  const maxAgeMs = monitor.intervalSeconds * 2 * 1000;
  if (ageMs > maxAgeMs) {
    const hours = Math.round(ageMs / 3600000);
    return {
      status: "down",
      latencyMs: httpResult.latencyMs,
      statusCode: httpResult.statusCode,
      message: `Cron "${jobName}" last succeeded ${hours}h ago`,
      metadata: { lastRun: row.created_at },
    };
  }

  return {
    ...httpResult,
    message: `Endpoint OK · cron "${jobName}" ran ${Math.round(ageMs / 60000)}m ago`,
    metadata: { lastRun: row.created_at, jobName },
  };
}

export async function runMonitorCheck(
  monitor: UptimeMonitor,
  auth: UptimeAuthConfig | null = null,
): Promise<CheckOutcome> {
  switch (monitor.monitorType) {
    case "ssl":
      return checkSsl(monitor);
    case "port":
      return checkPort(monitor);
    case "cron":
      return checkCron(monitor, auth);
    case "ping":
    case "keyword":
    case "http":
    default:
      return checkHttpLike(monitor, auth);
  }
}

export function statusColor(status: MonitorStatus): string {
  switch (status) {
    case "up":
      return "text-mint";
    case "degraded":
      return "text-amber-600 dark:text-amber-400";
    case "down":
      return "text-red-600 dark:text-red-400";
    default:
      return "text-muted";
  }
}
