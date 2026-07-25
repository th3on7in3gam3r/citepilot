"use client";

import { FeatureGate } from "@/components/billing/FeatureGate";
import { DashboardPageHeader } from "@/components/dashboard/DashboardUI";
import { MoneyPromptsPanel } from "@/components/dashboard/MoneyPromptsPanel";
import { DashboardNoWorkspaceEmpty } from "@/components/dashboard/layout/DashboardNoWorkspaceEmpty";
import { useBilling } from "@/contexts/BillingContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { getStoredWorkspaceId } from "@/lib/client/api";

export function MoneyPromptsPageClient() {
  const { workspace, ready } = useWorkspaceContext();
  const { isPaid, ready: billingReady } = useBilling();

  const workspaceId =
    workspace?.id ?? workspace?.workspaceId ?? getStoredWorkspaceId() ?? undefined;

  if (!ready || !billingReady) {
    return <div className="h-96 animate-pulse rounded-2xl bg-white/5" />;
  }

  if (!workspace || !workspaceId) {
    return (
      <DashboardNoWorkspaceEmpty description="Create a workspace before generating money prompts." />
    );
  }

  if (!isPaid) {
    return (
      <>
        <DashboardPageHeader
          title="Money Prompts"
          description="Enter your URL — we invent buyer prompts, find citation gaps, and draft filler pages so AI engines cite you."
        />
        <FeatureGate
          feature="money_prompts"
          title="Money Prompts"
          plan="pilot"
          description="Pilot unlocks the guided URL → prompts → check → draft fillers loop."
        />
      </>
    );
  }

  return (
    <>
      <DashboardPageHeader
        title="Money Prompts"
        description="Enter your site → we invent buyer prompts → we find where rivals get cited → we draft pages that fill those gaps."
      />
      <MoneyPromptsPanel
        workspaceId={workspaceId}
        workspaceDomain={workspace.domain}
      />
    </>
  );
}
