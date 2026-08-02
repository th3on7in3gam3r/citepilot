"use client";

import { FeatureRequestBoard } from "@/components/feedback/FeatureRequestBoard";
import { DashboardPageHeader } from "@/components/dashboard/DashboardUI";
import { DashboardSecondaryCta } from "@/components/dashboard/layout/DashboardCta";

export function FeedbackPageClient() {
  return (
    <div className="dash-page max-w-3xl">
      <DashboardPageHeader
        title="Feature requests & roadmap"
        description="Vote on what we ship next. Pilot and Fleet customers help prioritize the backlog."
        action={
          <DashboardSecondaryCta href="/dashboard/help" size="sm">
            Help & support →
          </DashboardSecondaryCta>
        }
      />
      <FeatureRequestBoard variant="dashboard" signInFrom="/dashboard/feedback" />
    </div>
  );
}
