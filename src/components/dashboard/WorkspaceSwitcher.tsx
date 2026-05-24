"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import type { WorkspaceListItem, WorkspaceLimitsInfo } from "@/hooks/useWorkspace";
import { workspaceLimitMessage } from "@/lib/billing/limits";

function planBadge(plan: WorkspaceLimitsInfo["plan"]) {
  if (plan === "fleet") return "Fleet";
  if (plan === "pilot") return "Pilot";
  return "Free";
}

export function WorkspaceSwitcher({ compact = false }: { compact?: boolean }) {
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
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const activeId = workspace?.workspaceId ?? workspace?.id;

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
      setError("Domain and buyer question are required.");
      return;
    }
    setCreating(true);
    setError(null);
    const result = await createClientWorkspace({
      domain: domain.trim(),
      buyerQuestion: buyerQuestion.trim(),
      description: clientName.trim() || `Client workspace for ${domain.trim()}`,
      businessType: workspace?.businessType || "agency-client",
    });
    setCreating(false);
    if (result.error) {
      setError(result.error);
      return;
    }
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

  const limitHint = limits ? workspaceLimitMessage(limits) : null;

  return (
    <div ref={rootRef} className={`relative ${compact ? "min-w-0 max-w-[12rem]" : "w-full"}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-surface text-left transition hover:border-accent/40 hover:bg-white ${
          compact ? "px-3 py-2" : "px-3 py-2.5"
        }`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">
            {workspace?.domain ?? "Select workspace"}
          </p>
          {!compact && limits && (
            <p className="truncate text-[11px] text-muted">
              {limits.max == null
                ? `${limits.count} client${limits.count === 1 ? "" : "s"} · ${planBadge(limits.plan)}`
                : `${limits.count}/${limits.max} · ${planBadge(limits.plan)}`}
            </p>
          )}
        </div>
        <span className="shrink-0 text-xs text-muted" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-2 overflow-hidden rounded-xl border border-border bg-white shadow-lg ${
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
                  + Add client workspace
                </button>
              ) : (
                <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950">
                  <p>{limitHint}</p>
                  <Link
                    href="/pricing"
                    className="mt-1 inline-block font-semibold text-accent hover:underline"
                    onClick={() => setOpen(false)}
                  >
                    Upgrade plan →
                  </Link>
                </div>
              )
            ) : (
              <form onSubmit={handleCreate} className="space-y-2 p-1">
                <p className="text-xs font-semibold text-ink">New client workspace</p>
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
                {error && <p className="text-xs text-red-600">{error}</p>}
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
                    onClick={() => {
                      setShowAdd(false);
                      setError(null);
                    }}
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
