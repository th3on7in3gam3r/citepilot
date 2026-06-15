"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import type { WorkspaceListItem, WorkspaceLimitsInfo } from "@/hooks/useWorkspace";
import { FeatureGate } from "@/components/billing/FeatureGate";
import { useToast } from "@/components/notifications/ToastProvider";

function planBadge(plan: WorkspaceLimitsInfo["plan"]) {
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
  /** When true, opens the dropdown with the new-site form (controlled from parent). */
  showAddForm?: boolean;
  onAddFormConsumed?: () => void;
}) {
  const {
    workspace,
    workspaces,
    limits,
    ready,
    switchWorkspace,
    createClientWorkspace,
    refresh,
  } = useWorkspaceContext();

  const [open, setOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [domain, setDomain] = useState("");
  const [buyerQuestion, setBuyerQuestion] = useState("");
  const [clientName, setClientName] = useState("");
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const activeId = workspace?.workspaceId ?? workspace?.id;

  useEffect(() => {
    if (!showAddForm) return;
    const t = setTimeout(() => {
      setOpen(true);
      setShowAdd(true);
      onAddFormConsumed?.();
    }, 0);
    return () => clearTimeout(t);
  }, [showAddForm, onAddFormConsumed]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowAdd(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleSwitch = useCallback(
    async (item: WorkspaceListItem) => {
      setOpen(false);
      await switchWorkspace(item.id);
    },
    [switchWorkspace],
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!domain.trim() || !buyerQuestion.trim()) {
      toast.error("Domain and buyer question are required.");
      return;
    }
    setCreating(true);
    const result = await createClientWorkspace({
      domain: domain.trim(),
      buyerQuestion: buyerQuestion.trim(),
      description: clientName.trim() || `Client workspace for ${domain.trim()}`,
      businessType: workspace?.businessType || "agency-client",
    });
    setCreating(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Workspace created.");
    setShowAdd(false);
    setOpen(false);
    setDomain("");
    setBuyerQuestion("");
    setClientName("");
    await refresh();
  }

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
    <div
      ref={rootRef}
      className={`relative ${compact ? "min-w-0 max-w-[12rem]" : isBar ? "min-w-0 flex-1" : "w-full"}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-2 rounded-xl border text-left transition ${shellClass} ${
          isBar ? "px-2.5 py-2" : compact ? "px-3 py-2" : "px-3 py-2.5"
        }`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Active site: ${workspace?.domain ?? "none selected"}`}
      >
        {isBar && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
            </svg>
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p
            className={`truncate font-semibold ${isBar ? "text-sm text-ink" : "text-sm text-ink"}`}
          >
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
        <span className={`shrink-0 text-xs ${isBar ? "text-muted" : "text-muted"}`} aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-lg dark:border-[#333] dark:bg-[#111] ${
            compact ? "right-0 w-72" : "left-0 right-0 w-full min-w-[16rem]"
          }`}
          role="listbox"
        >
          <div className="max-h-64 overflow-y-auto p-1">
            {workspaces.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted">No workspaces yet.</p>
            )}
            {workspaces.map((item) => {
              const selected = item.id === activeId;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => void handleSwitch(item)}
                  className={`flex w-full flex-col rounded-lg px-3 py-2.5 text-left transition ${
                    selected ? "bg-accent/10 text-accent" : "text-ink hover:bg-surface"
                  }`}
                >
                  <span className="truncate text-sm font-medium">{item.domain}</span>
                  {item.buyerQuestion && (
                    <span className="mt-0.5 line-clamp-1 text-xs text-muted">
                      {item.buyerQuestion}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-border p-2">
            {!showAdd ? (
              limits?.canCreate ? (
                <button
                  type="button"
                  onClick={() => setShowAdd(true)}
                  className="flex w-full items-center justify-center rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white hover:bg-ink/90"
                >
                  + Add another site
                </button>
              ) : limits ? (
                <FeatureGate
                  compact
                  feature="multi_workspace"
                  plan={limits.plan === "pilot" ? "fleet" : "pilot"}
                  title={
                    limits.plan === "pilot"
                      ? "More client workspaces (Fleet)"
                      : "Add another workspace"
                  }
                  description={
                    limits.plan === "pilot"
                      ? "Pilot includes up to 3 workspaces. Upgrade to Fleet for unlimited client sites and white-label reporting."
                      : "Free tier includes one workspace. Upgrade to Pilot for up to 3 client sites with weekly monitoring."
                  }
                  cta={limits.plan === "pilot" ? "Upgrade to Fleet →" : "Upgrade to Pilot →"}
                  highlights={
                    limits.plan === "pilot"
                      ? ["Unlimited workspaces", "White-label share links", "Bulk prompt import"]
                      : ["Up to 3 workspaces", "Weekly re-scans", "Email alerts & CMS publish"]
                  }
                />
              ) : null
            ) : (
              <form onSubmit={handleCreate} className="space-y-2 p-1">
                <p className="text-xs font-semibold text-ink">Add a new site</p>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Client label (optional)"
                  className="w-full rounded-lg border border-border px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="client.com"
                  required
                  className="w-full rounded-lg border border-border px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  value={buyerQuestion}
                  onChange={(e) => setBuyerQuestion(e.target.value)}
                  placeholder="Money prompt to track"
                  required
                  className="w-full rounded-lg border border-border px-3 py-2 text-xs"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 rounded-lg bg-ink py-2 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {creating ? "Creating…" : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="rounded-lg border border-border px-3 py-2 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
