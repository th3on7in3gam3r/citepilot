import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import type { Metadata } from "next";

const analyticsTitle = "LLM Visibility and Organic Analytics";
const analyticsDescription =
  "Track LLM citation visibility and Google Search Console performance in CitePilot — prompt benchmarks, competitor share of model, and GEO analytics to prove citation lift.";

export const metadata: Metadata = {
  title: clampSeoTitle(analyticsTitle),
  description: clampMetaDescription(analyticsDescription),
};

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
