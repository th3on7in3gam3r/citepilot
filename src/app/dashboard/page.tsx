import { DashboardCrawlContent } from "@/components/dashboard/DashboardCrawlContent";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { DashboardPageSkeleton } from "@/components/dashboard/layout/DashboardPageSkeleton";
import { OverviewSeoIntro } from "@/components/dashboard/OverviewSeoIntro";
import { getSessionUserId } from "@/lib/auth/server";
import { countWorkspacesForUser } from "@/lib/server/workspace";
import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const params = await searchParams;
  // Post-OAuth bounce from /start (session exchange completes on /dashboard first).
  if (params.from === "/start") {
    const userId = await getSessionUserId();
    if (userId) {
      try {
        const count = await countWorkspacesForUser(userId);
        if (count === 0) {
          redirect("/start");
        }
      } catch {
        /* stay on dashboard */
      }
    }
  }

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
