import type { AuditTrigger } from "@/lib/scans/types";

export function formatScanTrigger(trigger: AuditTrigger): string {
  switch (trigger) {
    case "manual":
      return "Manual";
    case "scheduled":
      return "Scheduled";
    case "bulk":
      return "Bulk";
    case "api":
      return "API";
    default:
      return "Manual";
  }
}

export function formatRelativeScanTime(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
