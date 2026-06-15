"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useToast } from "@/components/notifications/ToastProvider";
import { MyDashboardOverview } from "@/components/dashboard/overview/MyDashboardOverview";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { ONBOARDING_WELCOME_TOAST_KEY } from "@/lib/onboarding";

export function DashboardOverview() {
  const { refresh } = useWorkspaceContext();
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

  return <MyDashboardOverview />;
}
