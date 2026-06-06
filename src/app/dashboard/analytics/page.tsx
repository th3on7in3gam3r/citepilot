import { AnalyticsSeoIntro } from "@/components/dashboard/AnalyticsSeoIntro";
import { AnalyticsPageClient } from "./AnalyticsPageClient";

export default function AnalyticsPage() {
  return (
    <>
      <AnalyticsSeoIntro section="header" />
      <AnalyticsPageClient />
      <AnalyticsSeoIntro section="footer" />
    </>
  );
}
