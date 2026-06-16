"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useToast } from "@/components/notifications/ToastProvider";
import { MyDashboardOverview } from "@/components/dashboard/overview/MyDashboardOverview";
import { FleetAgencyOverview } from "@/components/dashboard/workspaces/FleetAgencyOverview";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { useBilling } from "@/contexts/BillingContext";
import { ONBOARDING_WELCOME_TOAST_KEY } from "@/lib/onboarding";
import { DashboardPageSkeleton } from "@/components/dashboard/layout/DashboardPageSkeleton";

export function DashboardOverview() {
  const { refresh } = useWorkspaceContext();
  const { isFleet, ready: billingReady } = useBilling();
  const searchParams = useSearchParams();
  const toast = useToast();

  useEffect(() => {
    if (searchParams.get("welcome") !== "1") return;

    if (sessionStorage.getItem(ONBOARDING_WELCOME_TOAST_KEY)) {
      sessionStorage.removeItem(ONBOARDING_WELCOME_TOAST_KEY);
      toast.success("Your audit is running — results in ~60 seconds.");
    }

    const first = setTimeout(() => refresh(), 4000);
    const second = setTimeout(() => refresh(), 10000);
    return () => {
      clearTimeout(first);
      clearTimeout(second);
    };
  }, [searchParams, refresh, toast]);

  if (!billingReady) return <DashboardPageSkeleton />;

  if (isFleet) return <FleetAgencyOverview />;

  return <MyDashboardOverview />;
}
