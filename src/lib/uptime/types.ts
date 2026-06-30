export type MonitorType = "http" | "ping" | "keyword" | "ssl" | "port" | "cron";

export type AuthType = "none" | "basic" | "digest" | "jwt";

export type MonitorStatus = "up" | "down" | "degraded" | "unknown";

export type UptimeAuthConfig = {
  username?: string;
  password?: string;
  token?: string;
  /** JWT header name — defaults to Authorization with Bearer prefix */
  jwtHeader?: string;
};

export type UptimeMonitor = {
  id: string;
  userId: string;
  workspaceId: string;
  name: string;
  monitorType: MonitorType;
  url: string;
  method: string;
  intervalSeconds: number;
  timeoutMs: number;
  expectedStatusMin: number;
  expectedStatusMax: number;
  keyword: string | null;
  keywordPresent: boolean;
  port: number | null;
  cronJobName: string | null;
  sslWarnDays: number;
  authType: AuthType;
  headers: Record<string, string>;
  enabled: boolean;
  lastStatus: MonitorStatus;
  lastCheckedAt: string | null;
  lastLatencyMs: number | null;
  lastError: string | null;
  consecutiveFailures: number;
  createdAt: string;
  updatedAt: string;
};

export type UptimeCheckResult = {
  id: string;
  monitorId: string;
  status: MonitorStatus;
  latencyMs: number | null;
  statusCode: number | null;
  message: string | null;
  metadata: Record<string, unknown>;
  checkedAt: string;
};

export type CreateMonitorInput = {
  workspaceId: string;
  name: string;
  monitorType: MonitorType;
  url: string;
  method?: string;
  intervalSeconds?: number;
  timeoutMs?: number;
  expectedStatusMin?: number;
  expectedStatusMax?: number;
  keyword?: string;
  keywordPresent?: boolean;
  port?: number;
  cronJobName?: string;
  sslWarnDays?: number;
  authType?: AuthType;
  auth?: UptimeAuthConfig;
  headers?: Record<string, string>;
  enabled?: boolean;
};

export type UpdateMonitorInput = Partial<
  Omit<CreateMonitorInput, "workspaceId">
> & {
  enabled?: boolean;
};

export type CheckOutcome = {
  status: MonitorStatus;
  latencyMs: number | null;
  statusCode: number | null;
  message: string | null;
  metadata?: Record<string, unknown>;
};

export const MONITOR_INTERVALS = [60, 300, 600, 900, 1800, 3600] as const;

export const MONITOR_LIMITS = {
  free: 0,
  pilot: 15,
  fleet: 100,
} as const;
