import Link from "next/link";
import type { WorkspaceSnapshot } from "@/lib/dashboard";

export function DashboardOverviewLead({ workspace }: { workspace: WorkspaceSnapshot }) {
  const updated = workspace.updatedAt
    ? new Date(workspace.updatedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div
      data-tour="workspace"
      className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <p className="text-sm text-muted">
          Tracking{" "}
          <span className="font-semibold text-ink">{workspace.domain}</span>
          {workspace.hasRealAudit ? (
            <>
              {" "}
              · citation score{" "}
              <span className="font-semibold text-accent-deep">
                {workspace.citationScore}
              </span>
            </>
          ) : (
            " · estimates until your first audit"
          )}
        </p>
        {!workspace.hasRealAudit && (
          <p className="mt-1 text-xs text-muted">
            Run a GEO audit to replace projections with measured platform and prompt data.{" "}
            <Link href="/audit" className="font-semibold text-accent hover:underline">
              Free 60-second audit →
            </Link>
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3 text-xs">
        {updated && (
          <span className="text-muted">Updated {updated}</span>
        )}
        <Link
          href="/dashboard/help"
          className="font-semibold text-accent hover:underline"
        >
          Dashboard guide
        </Link>
      </div>
    </div>
  );
}
