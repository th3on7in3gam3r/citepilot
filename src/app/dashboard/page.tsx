import { OverviewSeoIntro } from "@/components/dashboard/OverviewSeoIntro";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import type { Metadata } from "next";
import { Suspense } from "react";

const overviewTitle = "GEO Citation Dashboard Overview";
const overviewDescription =
  "Your GEO citation command center in CitePilot — executive briefing, money prompts, platform presence, alerts, and weekly actions to prove AI visibility lift.";

export const metadata: Metadata = {
  title: clampSeoTitle(overviewTitle),
  description: clampMetaDescription(overviewDescription),
};

export default function DashboardPage() {
  return (
    <>
      <OverviewSeoIntro section="header" />
      <Suspense
        fallback={
          <div className="h-40 animate-pulse rounded-2xl bg-surface" />
        }
      >
        <DashboardOverview />
      </Suspense>
      <OverviewSeoIntro section="footer" />
    </>
  );
}
