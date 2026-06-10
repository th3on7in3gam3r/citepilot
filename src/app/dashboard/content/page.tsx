import { ContentSeoIntro } from "@/components/dashboard/ContentSeoIntro";
import { DashboardCrawlContent } from "@/components/dashboard/DashboardCrawlContent";
import { SiteDetailsModule } from "@/components/dashboard/site-details/SiteDetailsModule";
import { Suspense } from "react";

export default function ContentPage() {
  return (
    <>
      <DashboardCrawlContent>
        <ContentSeoIntro section="header" />
        <ContentSeoIntro section="footer" />
      </DashboardCrawlContent>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" />}>
        <SiteDetailsModule />
      </Suspense>
    </>
  );
}
