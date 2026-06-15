"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { notifyChecklistUpdate } from "@/components/dashboard/GettingStartedChecklist";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { runAudit } from "@/lib/client/api";

export function DashboardCommandPalette() {
  const router = useRouter();
  const { workspace } = useWorkspaceContext();
  const [open, setOpen] = useState(false);
  const [isFleet, setIsFleet] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    void fetch("/api/billing/status", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { isFleet?: boolean; isPilot?: boolean } | null) =>
        setIsFleet(Boolean(data?.isFleet || data?.isPilot)),
      )
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isFleet) setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFleet]);

  const runScan = useCallback(async () => {
    if (!workspace || scanning) return;
    setScanning(true);
    setOpen(false);
    try {
      const prompts =
        workspace.preferences.monitoredPrompts.length > 0
          ? workspace.preferences.monitoredPrompts
          : [workspace.buyerQuestion].filter(Boolean);
      await runAudit({
        domain: workspace.domain,
        prompts,
        workspaceId: workspace.workspaceId ?? workspace.id,
      });
      notifyChecklistUpdate();
      router.refresh();
    } catch {
      /* toast handled by API consumer */
    } finally {
      setScanning(false);
    }
  }, [workspace, scanning, router]);

  if (!isFleet) return null;

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 p-4 pt-[15vh] backdrop-blur-sm"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
        <Command.Input
          placeholder="Search actions…"
          className="w-full border-b border-border px-4 py-3 text-sm outline-none"
        />
        <Command.List className="max-h-72 overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-sm text-muted">
            No matching actions.
          </Command.Empty>
          <Command.Group heading="Actions" className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
            <Command.Item
              value="new prompt add money prompt"
              onSelect={() => {
                setOpen(false);
                router.push("/dashboard/content?section=keywords");
              }}
              className="cursor-pointer rounded-lg px-3 py-2.5 text-sm text-ink aria-selected:bg-surface"
            >
              New prompt
              <span className="mt-0.5 block text-xs text-muted">
                Add a money prompt to monitor
              </span>
            </Command.Item>
            <Command.Item
              value="run scan rescan audit"
              onSelect={() => void runScan()}
              className="cursor-pointer rounded-lg px-3 py-2.5 text-sm text-ink aria-selected:bg-surface"
            >
              Run scan
              <span className="mt-0.5 block text-xs text-muted">
                Trigger a manual citation rescan
              </span>
            </Command.Item>
            <Command.Item
              value="view report proof"
              onSelect={() => {
                setOpen(false);
                router.push("/report/proof");
              }}
              className="cursor-pointer rounded-lg px-3 py-2.5 text-sm text-ink aria-selected:bg-surface"
            >
              View report
              <span className="mt-0.5 block text-xs text-muted">
                Open the proof report
              </span>
            </Command.Item>
          </Command.Group>
          <Command.Group heading="Navigate" className="mt-2 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
            {[
              { label: "Overview", href: "/dashboard" },
              { label: "Analytics", href: "/dashboard/analytics" },
              { label: "GEO Audit", href: "/dashboard/geo-audit" },
              { label: "Settings", href: "/dashboard/settings" },
            ].map((item) => (
              <Command.Item
                key={item.href}
                value={item.label}
                onSelect={() => {
                  setOpen(false);
                  router.push(item.href);
                }}
                className="cursor-pointer rounded-lg px-3 py-2.5 text-sm text-ink aria-selected:bg-surface"
              >
                {item.label}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
        <p className="border-t border-border px-4 py-2 text-[11px] text-muted">
          Fleet shortcut · <kbd className="rounded bg-surface px-1">⌘K</kbd>
        </p>
      </div>
    </Command.Dialog>
  );
}
