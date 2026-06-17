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
import { isFleetWorkspaceDashboardView } from "@/lib/workspace/fleet-dashboard";

export function DashboardOverview() {
  const { refresh, switchWorkspace, workspace } = useWorkspaceContext();
  const { isFleet, ready: billingReady } = useBilling();
  const searchParams = useSearchParams();
  const siteId = searchParams.get("site");
  const showFleetWorkspace = isFleetWorkspaceDashboardView(isFleet, siteId);
  const toast = useToast();

  useEffect(() => {
    if (!showFleetWorkspace || !siteId) return;
    const activeId = workspace?.workspaceId ?? workspace?.id;
    if (activeId !== siteId) {
      void switchWorkspace(siteId);
    }
  }, [showFleetWorkspace, siteId, switchWorkspace, workspace]);

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

  if (isFleet && !showFleetWorkspace) return <FleetAgencyOverview />;

  return <MyDashboardOverview showAgencyBackLink={showFleetWorkspace} />;
}
