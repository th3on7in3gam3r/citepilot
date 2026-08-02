"use client";

import { useEffect } from "react";
import { FeatureGate } from "@/components/billing/FeatureGate";
import { useWorkspaceSwitcher } from "@/contexts/WorkspaceSwitcherContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";

function planBadge(plan: "free" | "pilot" | "fleet") {
  if (plan === "fleet") return "Fleet";
  if (plan === "pilot") return "Pilot";
  return "Free";
}

export function WorkspaceSwitcher({
  compact = false,
  variant = "default",
  showAddForm = false,
  onAddFormConsumed,
}: {
  compact?: boolean;
  variant?: "default" | "bar";
  showAddForm?: boolean;
  onAddFormConsumed?: () => void;
}) {
  const { workspace, limits, ready } = useWorkspaceContext();
  const { openSwitcher, openWizard } = useWorkspaceSwitcher();

  useEffect(() => {
    if (!showAddForm) return;
    const t = setTimeout(() => {
      openWizard();
      onAddFormConsumed?.();
    }, 0);
    return () => clearTimeout(t);
  }, [showAddForm, onAddFormConsumed, openWizard]);

  if (!ready) {
    return (
      <div
        className={`animate-pulse rounded-xl bg-surface ${compact ? "h-9 w-36" : "h-10 w-full"}`}
      />
    );
  }

  const isBar = variant === "bar";
  const shellClass = isBar
    ? "border-border bg-card hover:border-accent/40 dark:border-[#333] dark:bg-[#111]"
    : "border-border bg-surface hover:border-accent/40 hover:bg-card dark:hover:bg-[#161616]";

  return (
    <button
      type="button"
      onClick={openSwitcher}
      className={`flex w-full items-center gap-2 rounded-xl border text-left transition ${shellClass} ${
        isBar ? "px-2.5 py-2" : compact ? "px-3 py-2" : "px-3 py-2.5"
      }`}
      aria-label={`Active site: ${workspace?.domain ?? "none selected"}. Open workspace switcher.`}
      title="Switch workspace (⌘⇧W)"
    >
      {isBar && (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
          </svg>
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">
          {workspace?.domain ?? "Select workspace"}
        </p>
        {!isBar && !compact && limits && (
          <p className="truncate text-[11px] text-muted">
            {limits.max == null
              ? `${limits.count} site${limits.count === 1 ? "" : "s"} · ${planBadge(limits.plan)}`
              : `${limits.count}/${limits.max} sites · ${planBadge(limits.plan)}`}
          </p>
        )}
      </div>
      {isBar && limits && (
        <span className="hidden shrink-0 rounded-md bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-muted lg:inline">
          {planBadge(limits.plan)}
        </span>
      )}
      <span className="shrink-0 text-xs text-muted" aria-hidden>
        ▾
      </span>
    </button>
  );
}

export function WorkspaceSwitcherAddGate() {
  const { limits } = useWorkspaceContext();
  const { openWizard } = useWorkspaceSwitcher();
  if (!limits) return null;
  if (limits.canCreate) {
    return (
      <button
        type="button"
        onClick={openWizard}
        className="flex w-full items-center justify-center rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white hover:bg-ink/90"
      >
        + Add another site
      </button>
    );
  }
  return (
    <FeatureGate
      compact
      feature="multi_workspace"
      plan={limits.plan === "pilot" ? "fleet" : "pilot"}
      title={limits.plan === "pilot" ? "More client workspaces (Fleet)" : "Add another workspace"}
      description={
        limits.plan === "pilot"
          ? "Pilot includes up to 3 workspaces. Upgrade to Fleet for unlimited client sites."
          : "Free tier includes one workspace. Upgrade to Pilot for up to 3 client sites."
      }
      cta={limits.plan === "pilot" ? "Upgrade to Fleet →" : "Upgrade to Pilot →"}
      highlights={
        limits.plan === "pilot"
          ? ["Unlimited workspaces", "Agency overview dashboard", "Bulk scans & exports"]
          : ["Up to 3 workspaces", "Weekly re-scans", "Email alerts & CMS publish"]
      }
    />
  );
}
