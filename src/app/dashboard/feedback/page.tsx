import type { Metadata } from "next";
import { FeedbackPageClient } from "@/components/dashboard/feedback/FeedbackPageClient";

export const metadata: Metadata = {
  title: "Feature requests",
  robots: { index: false, follow: false },
};

export default function DashboardFeedbackPage() {
  return <FeedbackPageClient />;
}
