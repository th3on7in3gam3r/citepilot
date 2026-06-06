import { AnalyticsSeoIntro } from "@/components/dashboard/AnalyticsSeoIntro";
import type { Metadata } from "next";
import { AnalyticsPageClient } from "./AnalyticsPageClient";

export const metadata: Metadata = {
  title: "LLM Visibility & Organic Analytics",
  description:
    "Track LLM citation visibility and Google Search Console performance — prompt benchmarks, competitor share, and GEO analytics to prove citation lift.",
};

export default function AnalyticsPage() {
  return (
    <>
      <AnalyticsPageClient />
      <AnalyticsSeoIntro />
    </>
  );
}
