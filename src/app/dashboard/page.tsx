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

/** Session + DB lookups — must not be statically optimized. */
export const dynamic = "force-dynamic";

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
      // Keep redirect() outside try/catch — Next throws NEXT_REDIRECT.
      let count = -1;
      try {
        count = await countWorkspacesForUser(userId);
      } catch {
        /* stay on dashboard on DB blip */
      }
      if (count === 0) {
        redirect("/start");
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
