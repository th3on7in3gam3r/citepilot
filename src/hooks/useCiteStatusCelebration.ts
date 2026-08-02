"use client";

import { useEffect, useRef } from "react";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import { isCiteStatusUpgrade } from "@/lib/score/cite-status";
import { publicScorePageUrl } from "@/lib/score/public-score-url";
import { useToast } from "@/components/notifications/ToastProvider";

function storageKey(workspaceId: string): string {
  return `citepilot-tier-${workspaceId}`;
}

export function useCiteStatusCelebration(workspace: WorkspaceSnapshot | null) {
  const toast = useToast();
  const announcedRef = useRef<string | null>(null);

  useEffect(() => {
    const workspaceId = workspace?.workspaceId ?? workspace?.id;
    if (!workspace?.hasRealAudit || !workspaceId) return;

    const tierKey = `${workspaceId}:${workspace.citationScore}`;
    if (announcedRef.current === tierKey) return;

    const previousTierId = localStorage.getItem(storageKey(workspaceId));
    const { upgraded, tier } = isCiteStatusUpgrade(
      previousTierId,
      workspace.citationScore,
    );

    localStorage.setItem(storageKey(workspaceId), tier.id);

    if (upgraded) {
      toast.success(tier.celebration, {
        description:
          tier.id === "highly-citeable"
            ? "Share your public score page and keep publishing cite-worthy content."
            : tier.description,
        action:
          tier.id === "highly-citeable" || tier.id === "cite-ready"
            ? {
                label: "Share score",
                href: publicScorePageUrl(workspace.domain),
              }
            : undefined,
      });
    }

    announcedRef.current = tierKey;
  }, [workspace, toast]);
}
