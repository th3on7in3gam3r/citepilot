import { DashboardCrawlContent } from "@/components/dashboard/DashboardCrawlContent";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { DashboardPageSkeleton } from "@/components/dashboard/layout/DashboardPageSkeleton";
import { OverviewSeoIntro } from "@/components/dashboard/OverviewSeoIntro";
import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import type { Metadata } from "next";
import { Suspense } from "react";

const overviewPath = "/dashboard";
const overviewTitle = "GEO Citation Dashboard Overview";
const overviewDescription =
  "Your GEO citation command center in CitePilot — executive briefing, money prompts, platform presence, alerts, and weekly actions to prove AI visibility lift.";

export const metadata: Metadata = {
  title: clampSeoTitle(overviewTitle),
  description: clampMetaDescription(overviewDescription),
  alternates: { canonical: overviewPath },
  robots: { index: true, follow: true },
  openGraph: {
    title: overviewTitle,
    description: clampMetaDescription(overviewDescription),
    url: overviewPath,
    type: "website",
  },
  twitter: {
    title: overviewTitle,
    description: clampMetaDescription(overviewDescription),
  },
};

export default function DashboardPage() {
  return (
    <>
      <DashboardCrawlContent>
        <OverviewSeoIntro section="header" />
        <OverviewSeoIntro section="footer" />
      </DashboardCrawlContent>
      <Suspense fallback={<DashboardPageSkeleton />}>
        <DashboardOverview />
      </Suspense>
    </>
  );
}
