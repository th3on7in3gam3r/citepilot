"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { MyDashboardOverview } from "@/components/dashboard/overview/MyDashboardOverview";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";

export function DashboardOverview() {
  const { refresh } = useWorkspaceContext();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("welcome") !== "1") return;
    const first = setTimeout(() => refresh(), 4000);
    const second = setTimeout(() => refresh(), 10000);
    return () => {
      clearTimeout(first);
      clearTimeout(second);
    };
  }, [searchParams, refresh]);

  return <MyDashboardOverview />;
}
