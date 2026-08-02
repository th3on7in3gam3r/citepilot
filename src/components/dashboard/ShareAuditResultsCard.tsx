"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/dashboard/DashboardUI";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { useToast } from "@/components/notifications/ToastProvider";
import {
  buildShareTweet,
  linkedInShareUrl,
  twitterShareUrl,
  type ShareExpiry,
} from "@/lib/audit/share-social";
import { trackEvent } from "@/lib/analytics/track";

type ShareMeta = {
  canShare: boolean;
  canProtect: boolean;
  hasAudit: boolean;
  auditId: string | null;
  score: number | null;
  cited: number | null;
  total: number | null;
  domain: string;
};

export function ShareAuditResultsCard({
  visible,
  onDismiss,
}: {
  visible: boolean;
  onDismiss?: () => void;
}) {
  const { workspace } = useWorkspaceContext();
  const workspaceId = workspace?.workspaceId ?? workspace?.id;
  const toast = useToast();
  const [meta, setMeta] = useState<ShareMeta | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [expiry, setExpiry] = useState<ShareExpiry>("30d");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!workspaceId || !visible) return;
    void fetch(`/api/audit/share?workspaceId=${encodeURIComponent(workspaceId)}`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((d: ShareMeta) => setMeta(d))
      .catch(() => setMeta(null));
  }, [workspaceId, visible]);

  if (!visible || !workspace?.hasRealAudit) return null;

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
          password: meta?.canProtect && password.trim() ? password.trim() : undefined,
          expiry: meta?.canProtect ? expiry : "never",
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Could not create share link");
        return;
      }
      setShareUrl(data.url ?? null);
      trackEvent("audit_share_created", { workspaceId, domain: meta?.domain });
      toast.success("Share link ready — post it anywhere.");
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
    toast.success("Link copied.");
    setTimeout(() => setCopied(false), 2000);
  }

  const score = meta?.score ?? workspace?.citationScore ?? 0;
  const cited = meta?.cited ?? workspace?.citedPlatforms ?? 0;
  const total = meta?.total ?? workspace?.totalPlatforms ?? 8;
  const domain = meta?.domain ?? workspace?.domain ?? "";
  const tweet =
    shareUrl &&
    buildShareTweet({
      domain,
      score,
      citedPrompts: cited,
      totalPrompts: total,
      reportUrl: shareUrl,
    });

  return (
    <Panel
      title="Share your results"
      className="mb-6 border-l-4 border-l-accent bg-gradient-to-br from-accent/5 to-transparent"
    >
      <p className="mb-4 text-sm text-muted">
        Turn your audit into social proof — every shared report is a marketing impression
        with a rich preview card on X and LinkedIn.
      </p>

      {!meta?.canShare ? (
        <p className="text-sm text-amber-800">
          Upgrade to Pilot to generate shareable proof report links.
        </p>
      ) : (
        <div className="space-y-4">
          {!shareUrl ? (
            <>
              {meta.canProtect && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-ink">
                    Password (optional, Fleet)
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave blank for public link"
                      className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-normal"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-ink">
                    Link expires
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
              <button
                type="button"
                disabled={loading}
                onClick={() => void createShare()}
                className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading ? "Creating link…" : "Create shareable report link"}
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <a
                  href={tweet ? twitterShareUrl(tweet) : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackEvent("proof_report_share_clicked", { channel: "twitter" })
                  }
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
                >
                  Share on X
                </a>
                <a
                  href={linkedInShareUrl(shareUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackEvent("proof_report_share_clicked", { channel: "linkedin" })
                  }
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
                >
                  Share on LinkedIn
                </a>
                <button
                  type="button"
                  onClick={() => void copyLink()}
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
                >
                  {copied ? "Copied!" : "Copy link"}
                </button>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
                >
                  Preview →
                </a>
              </div>
              {tweet && (
                <p className="rounded-xl bg-surface px-4 py-3 text-xs leading-relaxed text-muted whitespace-pre-line">
                  {tweet}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="mt-4 text-xs font-semibold text-muted hover:text-ink"
        >
          Dismiss
        </button>
      )}
    </Panel>
  );
}
