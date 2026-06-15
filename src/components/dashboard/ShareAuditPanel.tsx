"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/dashboard/DashboardUI";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { useToast } from "@/components/notifications/ToastProvider";
import type { ShareExpiry } from "@/lib/audit/share-social";

export function ShareAuditPanel() {
  const { workspace } = useWorkspaceContext();
  const workspaceId = workspace?.workspaceId ?? workspace?.id;
  const [canShare, setCanShare] = useState(false);
  const [canProtect, setCanProtect] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [password, setPassword] = useState("");
  const [expiry, setExpiry] = useState<ShareExpiry>("30d");

  useEffect(() => {
    if (!workspaceId) return;
    void fetch(`/api/audit/share?workspaceId=${encodeURIComponent(workspaceId)}`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((d: { canShare?: boolean; canProtect?: boolean; hasAudit?: boolean }) => {
        setCanShare(Boolean(d.canShare && d.hasAudit));
        setCanProtect(Boolean(d.canProtect));
      })
      .catch(() => setCanShare(false));
  }, [workspaceId]);

  async function createShare() {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/audit/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          workspaceId,
          password: canProtect && password.trim() ? password.trim() : undefined,
          expiry: canProtect ? expiry : "never",
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Could not create share link");
        return;
      }
      setShareUrl(data.url ?? null);
      toast.success("Share link created.");
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  }

  if (!workspace?.hasRealAudit) {
    return (
      <Panel title="Shareable proof report" className="mt-6">
        <p className="text-sm text-muted">
          Run an audit first, then share a public proof report with rich social previews (Pilot+).
        </p>
      </Panel>
    );
  }

  return (
    <Panel title="Shareable proof report" className="mt-6">
      <p className="mb-4 text-sm text-muted">
        Pilot+ — public link at <code className="text-xs">/report/proof/…</code> with
        Open Graph cards for X and LinkedIn. Fleet can add password protection and expiry.
      </p>
      {!canShare ? (
        <p className="text-sm text-amber-800">
          Pilot or Fleet plan required for shareable proof reports.
        </p>
      ) : (
        <div className="space-y-4">
          {canProtect && !shareUrl && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-ink">
                Password (optional)
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-normal"
                />
              </label>
              <label className="block text-sm font-semibold text-ink">
                Expires
                <select
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value as ShareExpiry)}
                  className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-normal"
                >
                  <option value="7d">7 days</option>
                  <option value="30d">30 days</option>
                  <option value="never">Never</option>
                </select>
              </label>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => void createShare()}
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Creating…" : "Create share link"}
            </button>
            {shareUrl && (
              <>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-surface"
                >
                  Preview report →
                </a>
                <button
                  type="button"
                  onClick={() => void copyLink()}
                  className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-surface"
                >
                  {copied ? "Copied!" : "Copy link"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}
