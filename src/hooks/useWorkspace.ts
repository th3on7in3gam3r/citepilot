"use client";

import { useCallback, useEffect, useState } from "react";
import {
  buildWorkspaceSnapshot,
  type WorkspaceSnapshot,
} from "@/lib/dashboard";
import type { WorkspaceSnapshotResponse } from "@/lib/api-types";
import {
  clearStoredWorkspaceId,
  createClientWorkspace as apiCreateClientWorkspace,
  createWorkspaceFromOnboarding,
  fetchDefaultWorkspace,
  fetchWorkspace,
  fetchWorkspacesList,
  getStoredWorkspaceId,
  normalizeSnapshot,
  runAudit,
  storeWorkspaceId,
} from "@/lib/client/api";
import { effectInit } from "@/lib/react/effect-init";
import { recordRecentWorkspace } from "@/lib/workspace/recent";
import type { WorkspaceLimits } from "@/lib/billing/limits";
import {
  ONBOARDING_STORAGE_KEY,
  type OnboardingAnswers,
} from "@/lib/onboarding";

export type WorkspaceListItem = {
  id: string;
  domain: string;
  displayName?: string | null;
  buyerQuestion: string;
  businessType: string;
  updatedAt: string;
  citationScore: number;
  hasRealAudit: boolean;
  promptCount?: number;
  lastScanAt?: string | null;
  status?: "active" | "paused";
  archivedAt?: string | null;
  scoreDeltaWeek?: number | null;
  scanInProgress?: boolean;
};

export type WorkspaceLimitsInfo = WorkspaceLimits;

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<WorkspaceSnapshot | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceListItem[]>([]);
  const [limits, setLimits] = useState<WorkspaceLimitsInfo | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    const list = await fetchWorkspacesList();
    if (list) {
      setWorkspaces(list.workspaces);
      setLimits(list.limits);
    }
    return list;
  }, []);

  const loadActiveWorkspace = useCallback(async () => {
    try {
      setLoadError(null);
      const storedId = getStoredWorkspaceId();
      if (storedId) {
        const fromApi = await fetchWorkspace(storedId);
        if (fromApi) {
          setWorkspace(normalizeSnapshot(fromApi, storedId));
          return;
        }
        clearStoredWorkspaceId();
      }

      const list = await loadList();
      const first = list?.workspaces[0];
      if (first) {
        storeWorkspaceId(first.id);
        setWorkspace(normalizeSnapshot(first.workspace, first.id));
        return;
      }

      const fallback = await fetchDefaultWorkspace();
      if (fallback) {
        storeWorkspaceId(fallback.id);
        setWorkspace(normalizeSnapshot(fallback.workspace, fallback.id));
        return;
      }

      try {
        const raw = sessionStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (raw) {
          const answers = JSON.parse(raw) as OnboardingAnswers;
          const created = await createWorkspaceFromOnboarding(answers);
          if (created) {
            setWorkspace(normalizeSnapshot(created.workspace, created.id));
            sessionStorage.removeItem(ONBOARDING_STORAGE_KEY);
            const prompts = [answers.buyerQuestion].filter(Boolean);
            if (prompts.length > 0) {
              await runAudit({
                domain: answers.domain,
                prompts,
                workspaceId: created.id,
              }).catch(() => undefined);
            }
            await loadList();
            return;
          }
          setWorkspace(buildWorkspaceSnapshot(answers));
          return;
        }
      } catch {
        /* ignore onboarding parse/create errors */
      }

      setWorkspace(null);
    } catch {
      setWorkspace(null);
      setLoadError(
        "We couldn’t load your workspaces. Check your connection and try again.",
      );
    }
  }, [loadList]);

  const refresh = useCallback(async () => {
    await loadList();
    await loadActiveWorkspace();
  }, [loadActiveWorkspace, loadList]);

  const applyWorkspace = useCallback(
    (data: WorkspaceSnapshotResponse, id: string) => {
      storeWorkspaceId(id);
      setWorkspace(normalizeSnapshot(data, id));
    },
    [],
  );

  const switchWorkspace = useCallback(
    async (id: string) => {
      storeWorkspaceId(id);
      recordRecentWorkspace(id);
      const fromApi = await fetchWorkspace(id);
      if (fromApi) {
        setWorkspace(normalizeSnapshot(fromApi, id));
      }
    },
    [],
  );

  const createClientWorkspace = useCallback(
    async (input: {
      domain: string;
      buyerQuestion: string;
      description?: string;
      businessType?: string;
    }) => {
      const result = await apiCreateClientWorkspace(input);
      if (result.error) {
        return { error: result.error };
      }
      if (result.id && result.workspace) {
        storeWorkspaceId(result.id);
        setWorkspace(normalizeSnapshot(result.workspace, result.id));
        if (result.limits) setLimits(result.limits);
      }
      await loadList();
      return { id: result.id };
    },
    [loadList],
  );

  useEffect(() => {
    effectInit(() => {
      void refresh().finally(() => setReady(true));
    });
  }, [refresh]);

  return {
    workspace,
    workspaces,
    limits,
    ready,
    loadError,
    refresh,
    applyWorkspace,
    switchWorkspace,
    createClientWorkspace,
  };
}
