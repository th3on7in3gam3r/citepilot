"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Panel } from "@/components/dashboard/DashboardUI";
import { PilotCheckoutButton } from "@/components/billing/PilotCheckoutButton";

type BillingStatus = {
  configured: boolean;
  plan: string;
  status: string;
  isPilot: boolean;
  isFleet: boolean;
  isPaid: boolean;
  planLabel: string;
  currentPeriodEnd: string | null;
  hasCustomer: boolean;
};

export function BillingPlanPanel() {
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/billing/status", { credentials: "include" });
    if (res.ok) {
      setBilling((await res.json()) as BillingStatus);
    }
  }, []);

  useEffect(() => {
    void load();
    const params = new URLSearchParams(window.location.search);
    if (params.get("billing") === "success") {
      setMessage("Subscription active — thank you!");
      window.history.replaceState({}, "", "/dashboard/settings");
    }
  }, [load]);

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
      else setMessage(data.error ?? "Could not open billing portal");
    } finally {
      setPortalLoading(false);
    }
  }

  const renews = billing?.currentPeriodEnd
    ? new Date(billing.currentPeriodEnd).toLocaleDateString()
    : null;

  return (
    <Panel title="Plan & billing">
      {message && (
        <p className="mb-4 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-ink">
          {message}
        </p>
      )}

      <p className="text-sm text-muted">
        Current plan:{" "}
        <strong className="text-ink">{billing?.planLabel ?? "Free (Audit)"}</strong>
        {billing?.isPaid && billing.status === "trialing" && (
          <span className="text-muted"> (trial)</span>
        )}
        {renews && billing?.isPaid && (
          <span className="mt-1 block text-xs">
            Renews {renews} · status: {billing.status}
          </span>
        )}
      </p>

      {billing?.isFleet && (
        <p className="mt-2 text-xs text-emerald-800">
          Fleet includes unlimited workspaces, 500 backlink credits, and all Pilot
          features.
        </p>
      )}

      {!billing?.configured && (
        <p className="mt-3 text-xs text-amber-700">
          Stripe is not fully configured on the server (missing price ID or keys).
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        {billing?.isPaid ? (
          billing.hasCustomer ? (
            <button
              type="button"
              disabled={portalLoading}
              onClick={() => void openPortal()}
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink/90 disabled:opacity-60"
            >
              {portalLoading ? "Opening…" : "Manage subscription"}
            </button>
          ) : (
            <span className="text-xs text-muted">
              Plan active (admin grant) — no Stripe subscription on file.
            </span>
          )
        ) : (
          <>
            <PilotCheckoutButton signedIn className="max-w-xs" plan="pilot">
              Upgrade to Pilot — $79/mo
            </PilotCheckoutButton>
            <PilotCheckoutButton signedIn className="max-w-xs" plan="fleet" variant="primary">
              Upgrade to Fleet — $249/mo
            </PilotCheckoutButton>
          </>
        )}
        <Link
          href="/pricing"
          className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-ink hover:bg-surface"
        >
          Compare plans
        </Link>
      </div>

      {!billing?.isPaid && (
        <p className="mt-4 text-xs text-muted">
          Pilot unlocks article generation, Webflow publish, and monitoring. Fleet
          adds unlimited client workspaces and 500 backlink credits.
        </p>
      )}
    </Panel>
  );
}
