"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
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

/** True when this async load may still apply (not superseded by a newer switch/refresh). */
export function shouldApplyWorkspaceLoad(
  epochAtStart: number,
  currentEpoch: number,
  expectedStoredId: string | null,
  currentStoredId: string | null,
): boolean {
  if (epochAtStart !== currentEpoch) return false;
  if (expectedStoredId != null && currentStoredId !== expectedStoredId) {
    return false;
  }
  return true;
}

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<WorkspaceSnapshot | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceListItem[]>([]);
  const [limits, setLimits] = useState<WorkspaceLimitsInfo | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  /** Bumped on every switch (and intentional selection change) so stale fetches cannot overwrite. */
  const selectionEpochRef = useRef(0);

  const loadList = useCallback(async () => {
    const list = await fetchWorkspacesList();
    if (list) {
      setWorkspaces(list.workspaces);
      setLimits(list.limits);
    }
    return list;
  }, []);

  const loadActiveWorkspace = useCallback(async () => {
    const epochAtStart = selectionEpochRef.current;
    try {
      setLoadError(null);
      const storedId = getStoredWorkspaceId();
      if (storedId) {
        const fromApi = await fetchWorkspace(storedId);
        if (
          !shouldApplyWorkspaceLoad(
            epochAtStart,
            selectionEpochRef.current,
            storedId,
            getStoredWorkspaceId(),
          )
        ) {
          return;
        }
        if (fromApi) {
          setWorkspace(normalizeSnapshot(fromApi, storedId));
          return;
        }
        // Only clear storage if it still points at the failed id (do not clobber a newer switch).
        if (getStoredWorkspaceId() === storedId) {
          clearStoredWorkspaceId();
        } else {
          return;
        }
      }

      if (epochAtStart !== selectionEpochRef.current) return;

      const list = await loadList();
      if (epochAtStart !== selectionEpochRef.current) return;
      // A switch may have stored an id while we were loading the list.
      const afterListStored = getStoredWorkspaceId();
      if (afterListStored) {
        const fromStored = await fetchWorkspace(afterListStored);
        if (
          !shouldApplyWorkspaceLoad(
            epochAtStart,
            selectionEpochRef.current,
            afterListStored,
            getStoredWorkspaceId(),
          )
        ) {
          return;
        }
        if (fromStored) {
          setWorkspace(normalizeSnapshot(fromStored, afterListStored));
          return;
        }
      }

      const first = list?.workspaces[0];
      if (first?.id) {
        if (first.workspace) {
          if (epochAtStart !== selectionEpochRef.current) return;
          if (getStoredWorkspaceId()) return;
          storeWorkspaceId(first.id);
          setWorkspace(normalizeSnapshot(first.workspace, first.id));
          return;
        }
        const fromList = await fetchWorkspace(first.id);
        if (epochAtStart !== selectionEpochRef.current) return;
        if (getStoredWorkspaceId()) return;
        if (fromList) {
          storeWorkspaceId(first.id);
          setWorkspace(normalizeSnapshot(fromList, first.id));
          return;
        }
      }

      const fallback = await fetchDefaultWorkspace();
      if (epochAtStart !== selectionEpochRef.current) return;
      if (getStoredWorkspaceId()) return;
      if (fallback?.workspace) {
        storeWorkspaceId(fallback.id);
        setWorkspace(normalizeSnapshot(fallback.workspace, fallback.id));
        return;
      }

      try {
        const raw = sessionStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (raw) {
          const answers = JSON.parse(raw) as OnboardingAnswers;
          const created = await createWorkspaceFromOnboarding(answers);
          if (epochAtStart !== selectionEpochRef.current) return;
          if (created?.workspace) {
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
          setLoadError(
            "We couldn’t create your workspace from saved setup answers. Continue setup to try again.",
          );
          setWorkspace(null);
          return;
        }
      } catch {
        /* ignore onboarding parse/create errors */
      }

      if (epochAtStart !== selectionEpochRef.current) return;
      setWorkspace(null);
    } catch {
      if (epochAtStart !== selectionEpochRef.current) return;
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
      selectionEpochRef.current += 1;
      storeWorkspaceId(id);
      setWorkspace(normalizeSnapshot(data, id));
    },
    [],
  );

  const switchWorkspace = useCallback(async (id: string) => {
    selectionEpochRef.current += 1;
    const epoch = selectionEpochRef.current;
    storeWorkspaceId(id);
    recordRecentWorkspace(id);
    const fromApi = await fetchWorkspace(id);
    if (
      !shouldApplyWorkspaceLoad(
        epoch,
        selectionEpochRef.current,
        id,
        getStoredWorkspaceId(),
      )
    ) {
      return;
    }
    if (fromApi) {
      setWorkspace(normalizeSnapshot(fromApi, id));
    }
  }, []);

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
        selectionEpochRef.current += 1;
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
