import { OverviewSeoIntro } from "@/components/dashboard/OverviewSeoIntro";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "GEO Citation Dashboard Overview",
  description:
    "Your GEO citation command center — executive briefing, money prompts, platform presence, alerts, and weekly actions to prove AI visibility lift in CitePilot.",
};

export default function DashboardPage() {
  return (
    <>
      <Suspense
        fallback={
          <div className="animate-pulse h-40 rounded-2xl bg-surface" />
        }
      >
        <DashboardOverview />
      </Suspense>
      <OverviewSeoIntro />
    </>
  );
}
