"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FeatureGate } from "@/components/billing/FeatureGate";
import { DashboardPageHeader, Panel } from "@/components/dashboard/DashboardUI";
import { DashboardActivationStrip } from "@/components/dashboard/layout/DashboardActivationStrip";
import {
  DashboardPrimaryCta,
  DashboardPrimaryCtaButton,
  DashboardSecondaryCta,
} from "@/components/dashboard/layout/DashboardCta";
import { DashboardNoWorkspaceEmpty } from "@/components/dashboard/layout/DashboardNoWorkspaceEmpty";
import { useBilling } from "@/contexts/BillingContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { useToast } from "@/components/notifications/ToastProvider";

type GrowthLoopStatus = {
  enabled: boolean;
  siteUrl: string;
  dailyArticles: boolean;
  autoPublish: boolean;
  autoBacklinks: boolean;
  autoRescan: boolean;
  lastRunAt: string | null;
  lastRunSummary: string | null;
  cmsConnected: boolean;
  cmsProvider: string | null;
  autopilotEnabled: boolean;
};

const STEPS = [
  {
    title: "Paste your site URL",
    detail: "We use your domain to personalize SEO topics and track AI citations.",
  },
  {
    title: "Connect a CMS",
    detail: "WordPress or Webflow recommended — articles publish automatically each day.",
  },
  {
    title: "Activate Growth Loop",
    detail: "Daily articles, backlink placements, and weekly AI visibility rescans.",
  },
];

function formatWhen(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function GrowthLoopPageClient() {
  const { workspace, ready } = useWorkspaceContext();
  const { isPaid, ready: billingReady } = useBilling();
  const toast = useToast();

  const [status, setStatus] = useState<GrowthLoopStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [running, setRunning] = useState(false);

  const [siteUrl, setSiteUrl] = useState("");
  const [dailyArticles, setDailyArticles] = useState(true);
  const [autoPublish, setAutoPublish] = useState(true);
  const [autoBacklinks, setAutoBacklinks] = useState(true);
  const [autoRescan, setAutoRescan] = useState(true);

  const workspaceId = workspace?.workspaceId ?? workspace?.id;

  const loadStatus = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/growth-loop`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = (await res.json()) as GrowthLoopStatus;
        setStatus(data);
        setSiteUrl(data.siteUrl || workspace?.domain || "");
        setDailyArticles(data.dailyArticles);
        setAutoPublish(data.autoPublish);
        setAutoBacklinks(data.autoBacklinks);
        setAutoRescan(data.autoRescan);
      }
    } catch {
      toast.error("Could not load Growth Loop status");
    } finally {
      setLoading(false);
    }
  }, [workspaceId, workspace?.domain, toast]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId || !siteUrl.trim()) {
      toast.error("Enter your website URL");
      return;
    }
    setActivating(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/growth-loop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "activate",
          siteUrl: siteUrl.trim(),
          dailyArticles,
          autoPublish,
          autoBacklinks,
          autoRescan,
          runNow: true,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        firstRun?: { articleTitle?: string; publishError?: string };
      };
      if (!res.ok) {
        toast.error(data.error ?? "Activation failed");
        return;
      }
      toast.success("Growth Loop activated");
      if (data.firstRun?.articleTitle) {
        toast.success(`First article: ${data.firstRun.articleTitle}`, {
          description: data.firstRun.publishError ?? "Check Content for the draft",
        });
      }
      await loadStatus();
    } catch {
      toast.error("Network error — try again");
    } finally {
      setActivating(false);
    }
  }

  async function handleRunNow() {
    if (!workspaceId) return;
    setRunning(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/growth-loop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "run" }),
      });
      const data = (await res.json()) as { error?: string; articleTitle?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Run failed");
        return;
      }
      toast.success(data.articleTitle ? `Published: ${data.articleTitle}` : "Growth Loop ran");
      await loadStatus();
    } catch {
      toast.error("Network error");
    } finally {
      setRunning(false);
    }
  }

  async function handleDeactivate() {
    if (!workspaceId) return;
    if (!window.confirm("Pause Growth Loop? Daily articles and auto-backlinks will stop.")) {
      return;
    }
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/growth-loop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "deactivate" }),
      });
      if (res.ok) {
        toast.success("Growth Loop paused");
        await loadStatus();
      }
    } catch {
      toast.error("Could not pause Growth Loop");
    }
  }

  if (!ready || loading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title="Growth Loop"
          description="Paste your URL once — daily SEO articles, backlinks, and AI search visibility."
        />
        <div className="h-64 animate-pulse rounded-2xl bg-surface" />
      </div>
    );
  }

  if (!workspace || !workspaceId) {
    return (
      <DashboardNoWorkspaceEmpty description="Create or pick a workspace to activate Growth Loop." />
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Growth Loop"
        description="Paste your URL once — we publish daily SEO articles to your site, build backlinks automatically, and track your brand in AI search results."
        action={
          isPaid && status?.enabled ? (
            <DashboardPrimaryCtaButton
              onClick={() => void handleRunNow()}
              disabled={running}
              size="sm"
            >
              {running ? "Running…" : "Run now →"}
            </DashboardPrimaryCtaButton>
          ) : isPaid ? (
            <DashboardPrimaryCta href="#gl-url" size="sm">
              Activate Growth Loop →
            </DashboardPrimaryCta>
          ) : undefined
        }
      />

      {workspace && !workspace.hasRealAudit && (
        <DashboardActivationStrip
          title="Run a GEO audit before Growth Loop"
          description="Daily articles and rescans work best when citation gaps are measured first — no fabricated lift metrics."
          primaryHref="/dashboard/geo-audit"
          primaryLabel="Run GEO audit →"
          secondaryHref="/dashboard/settings/integrations"
          secondaryLabel="Connect CMS"
        />
      )}

      {!billingReady ? (
        <div className="h-40 animate-pulse rounded-xl bg-surface" />
      ) : !isPaid ? (
        <FeatureGate
          feature="growth_loop"
          title="Growth Loop"
          description="One URL paste activates daily SEO content, CMS publishing, backlink placements, and weekly AI citation rescans."
          cta="Upgrade to Pilot →"
          highlights={[
            "Daily SEO articles tailored to your brand",
            "Auto-publish to WordPress, Webflow, and more",
            "Backlink network placements + AI visibility tracking",
            "Free preview: Pilot badge on the left rail — upgrade unlocks activate",
          ]}
        />
      ) : status?.enabled ? (
        <Panel title="Growth Loop is active">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Site" value={status.siteUrl} />
            <Stat
              label="CMS"
              value={status.cmsConnected ? (status.cmsProvider ?? "Connected") : "Not connected"}
            />
            <Stat label="Last run" value={formatWhen(status.lastRunAt)} />
            <Stat
              label="AI rescans"
              value={status.autopilotEnabled ? "Weekly" : "Off"}
            />
          </div>

          {status.lastRunSummary && (
            <p className="mt-4 rounded-xl border border-border bg-surface/50 px-4 py-3 text-sm text-muted">
              {status.lastRunSummary}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <DashboardPrimaryCtaButton
              onClick={() => void handleRunNow()}
              disabled={running}
              size="sm"
            >
              {running ? "Running…" : "Run now"}
            </DashboardPrimaryCtaButton>
            <DashboardSecondaryCta
              href="/dashboard/content?section=working-files"
              size="sm"
            >
              View articles
            </DashboardSecondaryCta>
            <DashboardSecondaryCta href="/dashboard/settings/integrations" size="sm">
              CMS settings
            </DashboardSecondaryCta>
            <button
              type="button"
              onClick={() => void handleDeactivate()}
              className="rounded-full px-5 py-2.5 text-sm font-medium text-muted hover:text-ink"
            >
              Pause
            </button>
          </div>

          {!status.cmsConnected && status.autoPublish && (
            <p className="mt-4 text-sm text-amber-700 dark:text-amber-300">
              Connect WordPress or Webflow in{" "}
              <Link href="/dashboard/settings/integrations" className="font-semibold underline">
                Settings → Integrations
              </Link>{" "}
              so articles publish to your site automatically.
            </p>
          )}
        </Panel>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="rounded-2xl border border-border bg-white p-5 dark:bg-surface"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                  {i + 1}
                </span>
                <h3 className="mt-3 font-semibold text-ink">{step.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{step.detail}</p>
              </div>
            ))}
          </div>

          <Panel title="Activate Growth Loop">
            <form onSubmit={handleActivate} className="max-w-xl space-y-5">
              <div>
                <label htmlFor="gl-url" className="block text-sm font-medium text-ink">
                  Website URL
                </label>
                <input
                  id="gl-url"
                  type="url"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  placeholder="https://yourbrand.com"
                  className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-accent dark:bg-surface"
                  required
                />
              </div>

              <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-ink">Automation</legend>
                {[
                  {
                    id: "gl-daily",
                    checked: dailyArticles,
                    onChange: setDailyArticles,
                    label: "Generate one SEO article every day",
                  },
                  {
                    id: "gl-publish",
                    checked: autoPublish,
                    onChange: setAutoPublish,
                    label: "Auto-publish to connected CMS",
                  },
                  {
                    id: "gl-backlinks",
                    checked: autoBacklinks,
                    onChange: setAutoBacklinks,
                    label: "Request backlink placements after each publish",
                  },
                  {
                    id: "gl-rescan",
                    checked: autoRescan,
                    onChange: setAutoRescan,
                    label: "Weekly AI visibility rescans + Autopilot insights",
                  },
                ].map((item) => (
                  <label
                    key={item.id}
                    htmlFor={item.id}
                    className="flex cursor-pointer items-center gap-2.5 text-sm text-ink"
                  >
                    <input
                      id={item.id}
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => item.onChange(e.target.checked)}
                      className="h-4 w-4 rounded accent-ink"
                    />
                    {item.label}
                  </label>
                ))}
              </fieldset>

              {status && !status.cmsConnected && autoPublish && (
                <p className="text-sm text-muted">
                  No CMS connected yet — articles will save to your CitePilot blog until you{" "}
                  <Link
                    href="/dashboard/settings/integrations"
                    className="font-semibold text-accent hover:underline"
                  >
                    connect WordPress or Webflow
                  </Link>
                  .
                </p>
              )}

              <DashboardPrimaryCtaButton type="submit" disabled={activating} size="sm">
                {activating ? "Activating & generating first article…" : "Activate Growth Loop"}
              </DashboardPrimaryCtaButton>
            </form>
          </Panel>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
