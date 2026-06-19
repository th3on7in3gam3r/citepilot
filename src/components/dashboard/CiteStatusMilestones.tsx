import { citeStatusMilestones } from "@/lib/score/cite-status";
import type { WorkspaceSnapshot } from "@/lib/dashboard";

export function CiteStatusMilestones({
  workspace,
  compact = false,
}: {
  workspace: WorkspaceSnapshot;
  compact?: boolean;
}) {
  const milestones = citeStatusMilestones(workspace);
  const unlocked = milestones.filter((milestone) => milestone.unlocked).length;

  return (
    <div className={compact ? "mt-3" : "mt-4"}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Cite milestones
        </p>
        <p className="text-[10px] font-semibold text-muted">
          {unlocked}/{milestones.length} unlocked
        </p>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {milestones.map((milestone) => (
          <span
            key={milestone.id}
            title={milestone.hint}
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
              milestone.unlocked
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-border bg-surface/60 text-muted"
            }`}
          >
            {milestone.unlocked ? "✓ " : ""}
            {milestone.label}
          </span>
        ))}
      </div>
    </div>
  );
}
