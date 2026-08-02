"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  PrivacySettingsBlock,
  SiteDetailsFooter,
} from "@/components/dashboard/site-details/SiteDetailsShared";
import { GooeyFilter, LiquidToggle } from "@/components/ui/liquid-toggle";
import { useToast } from "@/components/notifications/ToastProvider";
import { updateWorkspace } from "@/lib/client/api";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import {
  GOOGLE_SERVICES,
  loadGoogleServices,
  saveGoogleServices,
  type GoogleServiceId,
  type GoogleServiceState,
} from "@/lib/site-details/google-services";

export function GoogleDataSection({
  workspaceId,
  domain,
  onContinue,
}: {
  workspaceId: string;
  domain: string;
  onContinue: () => void;
}) {
  const toast = useToast();
  const { workspace, applyWorkspace } = useWorkspaceContext();
  const [services, setServices] = useState<GoogleServiceState>(() =>
    loadGoogleServices(workspaceId),
  );
  const [gscConnected, setGscConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(
    () => workspace?.preferences?.weeklyDigest ?? false,
  );
  const [savingDigest, setSavingDigest] = useState(false);

  const loadGsc = useCallback(async () => {
    const res = await fetch(
      `/api/gsc/metrics?workspaceId=${encodeURIComponent(workspaceId)}`,
      { credentials: "include" },
    );
    if (!res.ok) return;
    const data = (await res.json()) as { metrics?: { connected?: boolean } };
    setGscConnected(Boolean(data.metrics?.connected));
    if (data.metrics?.connected) {
      setServices((prev) => {
        const next = { ...prev, "search-console": true };
        saveGoogleServices(workspaceId, next);
        return next;
      });
    }
  }, [workspaceId]);

  useEffect(() => {
    const t = setTimeout(() => {
      void loadGsc();
    }, 0);
    return () => clearTimeout(t);
  }, [loadGsc]);

  useEffect(() => {
    saveGoogleServices(workspaceId, services);
  }, [workspaceId, services]);

  // Sync digest toggle when workspace loads
  useEffect(() => {
    if (workspace?.preferences?.weeklyDigest !== undefined) {
      const t = setTimeout(() => {
        setWeeklyDigest(workspace.preferences.weeklyDigest);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [workspace?.preferences?.weeklyDigest]);

  async function toggleService(id: GoogleServiceId, enabled: boolean) {
    if (id === "search-console" && enabled && !gscConnected) {
      const res = await fetch(
        `/api/gsc/connect?workspaceId=${encodeURIComponent(workspaceId)}`,
        { credentials: "include" },
      );
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      toast.warning("Search Console unavailable", {
        description: data.error ?? "Connect Google Search Console from Analytics when OAuth is configured.",
        action: { label: "Open Analytics", href: "/dashboard/analytics" },
      });
      return;
    }

    setServices((prev) => ({ ...prev, [id]: enabled }));
  }

  async function toggleWeeklyDigest(enabled: boolean) {
    if (!workspace || !workspaceId) return;
    setSavingDigest(true);
    try {
      const updated = await updateWorkspace(workspaceId, {
        domain: workspace.domain,
        businessType: workspace.businessType,
        description: workspace.description,
        buyerQuestion: workspace.buyerQuestion,
        audiences: workspace.audiences,
        competitors: workspace.competitors,
        referral: "",
        preferences: {
          ...(workspace.preferences ?? {}),
          weeklyDigest: enabled,
        },
      });
      if (updated) {
        applyWorkspace(updated, workspaceId);
        setWeeklyDigest(enabled);
        toast.success(
          enabled ? "Weekly digest enabled" : "Weekly digest disabled",
          { description: enabled ? "You'll receive a citation digest every Monday." : "Weekly digest emails turned off." },
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save preference.");
    } finally {
      setSavingDigest(false);
    }
  }

  function handleSave(andContinue: boolean) {
    setSaving(true);
    saveGoogleServices(workspaceId, services);
    toast.success("Google services saved", {
      description: `Integration preferences updated for ${domain.replace(/^https?:\/\//, "")}.`,
    });
    setSaving(false);
    if (andContinue) onContinue();
  }

  return (
    <div className="space-y-8">
      <GooeyFilter />

      <section>
        <h3 className="text-sm font-semibold text-[#0f172a]">Google Services</h3>
        <p className="mt-1 text-sm text-[#64748b]">
          Connect Google tools to enrich your citation data with organic search performance.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {GOOGLE_SERVICES.map((svc) => {
            const enabled = services[svc.id];
            const liveGsc = svc.id === "search-console" && gscConnected;
            return (
              <div
                key={svc.id}
                className="flex flex-col rounded-2xl border border-[#e8edf3] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f8fafb] text-xs font-bold text-[#64748b]">
                      {svc.logo}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#0f172a]">{svc.label}</p>
                      {liveGsc && (
                        <p className="text-[11px] font-medium text-[#0ea5e9]">● Connected</p>
                      )}
                      {svc.id === "analytics" && (
                        <p className="text-[11px] text-[#94a3b8]">View in Analytics →</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <LiquidToggle
                      id={`google-${svc.id}`}
                      checked={enabled}
                      variant="default"
                      aria-label={`Toggle ${svc.label}`}
                      onCheckedChange={(v) => void toggleService(svc.id, v)}
                    />
                    <span className={`text-[10px] font-bold tracking-wide ${enabled ? "text-[#0284c7]" : "text-[#94a3b8]"}`}>
                      {enabled ? "ENABLED" : "DISABLED"}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-[#64748b]">{svc.description}</p>
                <p className="mt-3 text-xs text-[#64748b]">
                  <Link href={svc.learnHref} className="font-medium text-[#0ea5e9] hover:underline">
                    {svc.id === "search-console" ? "Connect Search Console →" : "Open Analytics →"}
                  </Link>
                </p>
              </div>
            );
          })}

          {/* Weekly Citation Digest — real DB-backed toggle */}
          <div className="flex flex-col rounded-2xl border border-[#e8edf3] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0fdf4] text-xs font-bold text-[#16a34a]">
                  ✉
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#0f172a]">Weekly Citation Digest</p>
                  <p className="text-[11px] text-[#94a3b8]">Every Monday</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <LiquidToggle
                  id="weekly-digest-toggle"
                  checked={weeklyDigest}
                  variant="default"
                  aria-label="Toggle weekly citation digest"
                  onCheckedChange={(v) => void toggleWeeklyDigest(v)}
                  disabled={savingDigest}
                />
                <span className={`text-[10px] font-bold tracking-wide ${weeklyDigest ? "text-[#0284c7]" : "text-[#94a3b8]"}`}>
                  {weeklyDigest ? "ENABLED" : "DISABLED"}
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs text-[#64748b]">
              Receive a weekly summary of citation score changes, platform wins &amp; losses, and top gaps — delivered every Monday after rescans.
            </p>
            <p className="mt-3 text-xs text-[#64748b]">
              Set your monitoring email in{" "}
              <Link href="/dashboard/settings" className="font-medium text-[#0ea5e9] hover:underline">
                Settings →
              </Link>
            </p>
          </div>
        </div>
      </section>

      <PrivacySettingsBlock />

      <SiteDetailsFooter
        saving={saving}
        onSave={() => handleSave(false)}
        onSaveContinue={() => handleSave(true)}
      />
    </div>
  );
}
