"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useBilling } from "@/contexts/BillingContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import {
  clearTourCompletedLocal,
  startProductTour,
  TOUR_COMPLETED_KEY,
} from "@/lib/onboarding/tour";
import { WORKSPACE_LIMIT_FREE, WORKSPACE_LIMIT_PILOT } from "@/lib/billing/limits";
import { effectInit } from "@/lib/react/effect-init";

function workspaceLimitLabel(isFleet: boolean, isPaid: boolean): string {
  if (isFleet) return "unlimited";
  if (isPaid) return String(WORKSPACE_LIMIT_PILOT);
  return String(WORKSPACE_LIMIT_FREE);
}

export function ProductTour() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { workspace, ready: workspaceReady } = useWorkspaceContext();
  const { isFleet, isPaid, ready: billingReady } = useBilling();
  const startedRef = useRef(false);

  useEffect(() => {
    effectInit(() => {
      if (startedRef.current) return;
      if (!workspaceReady || !billingReady || !workspace) return;
      if (isFleet) return;
      if (pathname !== "/dashboard") return;
      if (workspace.hasRealAudit) return;

      const forceRestart = searchParams.get("tour") === "restart";

      async function maybeStart() {
        if (!forceRestart) {
          const localDone = localStorage.getItem(TOUR_COMPLETED_KEY);
          if (localDone === "1") return;
        } else {
          clearTourCompletedLocal();
        }

        const res = await fetch("/api/onboarding/tour", { credentials: "include" });
        if (!res.ok) return;

        const data = (await res.json()) as {
          completed?: boolean;
          shouldShow?: boolean;
        };

        if (!forceRestart) {
          if (data.completed) {
            localStorage.setItem(TOUR_COMPLETED_KEY, "1");
            return;
          }
          if (!data.shouldShow) return;
        }

        startedRef.current = true;

        window.setTimeout(() => {
          startProductTour({
            workspaceLimitLabel: workspaceLimitLabel(isFleet, isPaid),
            onComplete: async () => {
              await fetch("/api/onboarding/tour", {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "complete" }),
              });
            },
          });
        }, 800);
      }

      void maybeStart();
    });
  }, [
    workspaceReady,
    billingReady,
    workspace,
    isFleet,
    isPaid,
    pathname,
    searchParams,
  ]);

  return null;
}
