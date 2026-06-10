"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/dashboard/DashboardUI";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { useToast } from "@/components/notifications/ToastProvider";

export function ShareAuditPanel() {
  const { workspace } = useWorkspaceContext();
  const workspaceId = workspace?.workspaceId ?? workspace?.id;
  const [canShare, setCanShare] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    void fetch(`/api/audit/share?workspaceId=${encodeURIComponent(workspaceId)}`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((d: { canShare?: boolean; hasAudit?: boolean }) => {
        setCanShare(Boolean(d.canShare && d.hasAudit));
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
        body: JSON.stringify({ workspaceId }),
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
      <Panel title="White-label audit report" className="mt-6">
        <p className="text-sm text-muted">
          Run an audit first, then share a branded report link with clients (Fleet).
        </p>
      </Panel>
    );
  }

  return (
    <Panel title="White-label audit report" className="mt-6">
      <p className="mb-4 text-sm text-muted">
        Fleet — generate a public link clients can view or save as PDF. Branding
        comes from Settings → White-label.
      </p>
      {!canShare ? (
        <p className="text-sm text-amber-800">
          Fleet plan required for shareable white-label reports.
        </p>
      ) : (
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
      )}
    </Panel>
  );
}
