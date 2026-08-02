export type ScanJobStatus = "queued" | "running" | "completed" | "failed";
export type ScanJobItemStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "skipped";

export type AuditTrigger = "manual" | "scheduled" | "bulk" | "api";

export const SCAN_CONCURRENCY = 3;
export const ESTIMATED_MINUTES_PER_WORKSPACE = 0.75;
