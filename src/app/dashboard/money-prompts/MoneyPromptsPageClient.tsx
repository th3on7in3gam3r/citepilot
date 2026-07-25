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
          description="Generate the buyer prompts people type into ChatGPT and Perplexity — then track where competitors win citations."
        />
        <FeatureGate
          feature="money_prompts"
          title="Money Prompts"
          plan="pilot"
          description="Pilot unlocks AI money-prompt generation, citation checks, and a prioritized gap queue."
        />
      </>
    );
  }

  return (
    <>
      <DashboardPageHeader
        title="Money Prompts"
        description="Generate buyer prompts, activate monitoring, and close citation gaps across AI engines."
      />
      <MoneyPromptsPanel workspaceId={workspaceId} />
    </>
  );
}
