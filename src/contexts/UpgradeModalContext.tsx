"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { UpgradeModal } from "@/components/billing/UpgradeModal";
import { useBilling } from "@/contexts/BillingContext";
import {
  markUpgradeModalDismissed,
  upgradeModalCooldownActive,
} from "@/lib/upgrade/modal-cooldown";
import { trackEvent } from "@/lib/analytics/track";
import type { BillingPlan } from "@/lib/billing/types";

export type UpgradeModalRequest = {
  feature: string;
  title: string;
  description: string;
  plan?: Extract<BillingPlan, "pilot" | "fleet">;
  unlocks?: readonly string[];
};

type UpgradeModalContextValue = {
  openUpgradeModal: (request: UpgradeModalRequest) => void;
};

const UpgradeModalContext = createContext<UpgradeModalContextValue | null>(null);

function userTierLabel(plan: string, isPaid: boolean): string {
  if (!isPaid) return "free";
  return plan === "fleet" ? "fleet" : "pilot";
}

export function UpgradeModalProvider({ children }: { children: ReactNode }) {
  const { isPaid, planLabel } = useBilling();
  const [request, setRequest] = useState<UpgradeModalRequest | null>(null);
  const [open, setOpen] = useState(false);

  const tier = useMemo(() => {
    if (planLabel.toLowerCase().includes("fleet")) return "fleet";
    if (isPaid) return "pilot";
    return "free";
  }, [isPaid, planLabel]);

  const openUpgradeModal = useCallback(
    (next: UpgradeModalRequest) => {
      if (isPaid && next.plan !== "fleet") return;
      if (upgradeModalCooldownActive()) return;

      setRequest(next);
      setOpen(true);
      trackEvent("upgrade_modal_shown", {
        feature_name: next.feature,
        user_tier: tier,
      });
    },
    [isPaid, tier],
  );

  const dismiss = useCallback(() => {
    if (request) {
      trackEvent("upgrade_modal_dismissed", {
        feature_name: request.feature,
        user_tier: tier,
      });
    }
    markUpgradeModalDismissed();
    setOpen(false);
  }, [request, tier]);

  const value = useMemo(() => ({ openUpgradeModal }), [openUpgradeModal]);

  return (
    <UpgradeModalContext.Provider value={value}>
      {children}
      {request && (
        <UpgradeModal
          open={open}
          request={request}
          onDismiss={dismiss}
          onCheckoutClick={() => {
            trackEvent("upgrade_modal_clicked", {
              feature_name: request.feature,
              user_tier: tier,
              plan: request.plan ?? "pilot",
            });
            trackEvent("upgrade_cta_clicked", {
              source: "modal",
              feature_name: request.feature,
              plan: request.plan ?? "pilot",
            });
          }}
        />
      )}
    </UpgradeModalContext.Provider>
  );
}

export function useUpgradeModal(): UpgradeModalContextValue {
  const ctx = useContext(UpgradeModalContext);
  if (!ctx) {
    throw new Error("useUpgradeModal must be used within UpgradeModalProvider");
  }
  return ctx;
}

export function useUpgradeModalOptional(): UpgradeModalContextValue | null {
  return useContext(UpgradeModalContext);
}

export function userTierForAnalytics(isPaid: boolean, isFleet: boolean): string {
  if (!isPaid) return "free";
  return isFleet ? "fleet" : "pilot";
}
