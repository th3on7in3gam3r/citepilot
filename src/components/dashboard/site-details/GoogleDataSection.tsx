"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  PrivacySettingsBlock,
  SiteDetailsFooter,
} from "@/components/dashboard/site-details/SiteDetailsShared";
import { GooeyFilter, LiquidToggle } from "@/components/ui/liquid-toggle";
import { useToast } from "@/components/notifications/ToastProvider";
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
  const [services, setServices] = useState<GoogleServiceState>(() =>
    loadGoogleServices(workspaceId),
  );
  const [gscConnected, setGscConnected] = useState(false);
  const [saving, setSaving] = useState(false);

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
    void loadGsc();
  }, [loadGsc]);

  useEffect(() => {
    saveGoogleServices(workspaceId, services);
  }, [workspaceId, services]);

  async function toggleService(id: GoogleServiceId, enabled: boolean) {
    if (id === "search-console" && enabled && !gscConnected) {
      const res = await fetch(
        `/api/gsc/connect?workspaceId=${encodeURIComponent(workspaceId)}`,
        { credentials: "include" },
      );
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
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
          Leverage Google business services for your SEO campaigns.
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
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
                        <p className="text-[11px] font-medium text-[#0ea5e9]">Connected</p>
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
                    <span
                      className={`text-[10px] font-bold tracking-wide ${
                        enabled ? "text-[#0284c7]" : "text-[#94a3b8]"
                      }`}
                    >
                      {enabled ? "ENABLED" : "DISABLED"}
                    </span>
                  </div>
                </div>
                <p className="mt-5 text-xs text-[#64748b]">
                  What do we use this info for?{" "}
                  <Link href={svc.learnHref} className="font-medium text-[#0ea5e9] hover:underline">
                    Click here to learn more
                  </Link>
                </p>
              </div>
            );
          })}
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
