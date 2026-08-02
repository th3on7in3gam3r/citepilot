"use client";

import { useCallback, useEffect, useState } from "react";
import { Panel } from "@/components/dashboard/DashboardUI";
import { useToast } from "@/components/notifications/ToastProvider";
import { REFERRAL_SHARE_COPY } from "@/lib/referrals/constants";
import { trackEvent } from "@/lib/analytics/track";

type ReferralStats = {
  referralCode: string;
  referralLink: string;
  linkClicks: number;
  signedUp: number;
  converted: number;
  creditsEarned: number;
  creditsApplied: number;
  creditsRemaining: number;
  atCreditCap: boolean;
};

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface/50 px-4 py-3 text-center">
      <p className="text-2xl font-bold tabular-nums text-ink">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  );
}

export function ReferralPanel() {
  const toast = useToast();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/referrals/status", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ReferralStats | null) => setStats(d))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const copyLink = useCallback(async () => {
    if (!stats?.referralLink) return;
    try {
      await navigator.clipboard.writeText(stats.referralLink);
      toast.success("Referral link copied");
    } catch {
      toast.error("Could not copy link");
    }
  }, [stats?.referralLink, toast]);

  if (loading) {
    return (
      <Panel title="Refer & Earn">
        <p className="text-sm text-muted">Loading referral program…</p>
      </Panel>
    );
  }

  if (!stats) return null;

  const shareText = `${REFERRAL_SHARE_COPY} ${stats.referralLink}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(stats.referralLink)}`;

  return (
    <Panel title="Refer & Earn">
      <p className="mb-4 text-sm text-muted">
        Share CitePilot with your network. Earn{" "}
        <strong className="font-semibold text-ink">1 month free</strong> for each
        friend who upgrades to Pilot or Fleet — up to 6 months total.
      </p>

      <label className="block text-sm font-semibold text-ink">Your referral link</label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          readOnly
          value={stats.referralLink}
          className="min-w-0 flex-1 rounded-xl border border-border bg-surface/40 px-4 py-2.5 text-sm text-ink"
        />
        <button
          type="button"
          onClick={() => void copyLink()}
          className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90"
        >
          Copy link
        </button>
      </div>
      <p className="mt-1.5 text-xs text-muted">
        Code: <span className="font-mono font-semibold">{stats.referralCode}</span>
      </p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Referrals sent" value={stats.linkClicks} />
        <Stat label="Signed up" value={stats.signedUp} />
        <Stat label="Converted to paid" value={stats.converted} />
      </div>

      <div className="mt-4 rounded-xl border border-accent/25 bg-accent/5 px-4 py-3 text-sm text-ink">
        <p>
          <strong>{stats.creditsEarned}</strong> month
          {stats.creditsEarned === 1 ? "" : "s"} earned ·{" "}
          <strong>{stats.creditsApplied}</strong> applied to invoices
          {stats.atCreditCap ? (
            <span className="text-muted"> · cap reached (6 months max)</span>
          ) : stats.creditsRemaining > 0 ? (
            <span className="text-muted">
              {" "}
              · {stats.creditsRemaining} more available
            </span>
          ) : null}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("referral_share_clicked", { channel: "twitter" })}
          className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface"
        >
          Share on Twitter
        </a>
        <a
          href={linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("referral_share_clicked", { channel: "linkedin" })}
          className="inline-flex rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface"
        >
          Share on LinkedIn
        </a>
      </div>
    </Panel>
  );
}
