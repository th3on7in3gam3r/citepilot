"use client";

import { useCallback, useEffect, useState } from "react";
import {
  buildWorkspaceSnapshot,
  type WorkspaceSnapshot,
} from "@/lib/dashboard";
import {
  clearStoredWorkspaceId,
  createWorkspaceFromOnboarding,
  fetchDefaultWorkspace,
  fetchWorkspace,
  getStoredWorkspaceId,
  normalizeSnapshot,
  storeWorkspaceId,
} from "@/lib/client/api";
import {
  ONBOARDING_STORAGE_KEY,
  type OnboardingAnswers,
} from "@/lib/onboarding";

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<WorkspaceSnapshot | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const storedId = getStoredWorkspaceId();
    if (storedId) {
      const fromApi = await fetchWorkspace(storedId);
      if (fromApi) {
        setWorkspace(normalizeSnapshot(fromApi, storedId));
        return;
      }
      clearStoredWorkspaceId();
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
          return;
        }
        setWorkspace(buildWorkspaceSnapshot(answers));
        return;
      }
    } catch {
      /* ignore */
    }

    setWorkspace(buildWorkspaceSnapshot({}));
  }, []);

  useEffect(() => {
    refresh().finally(() => setReady(true));
  }, [refresh]);

  return { workspace, ready, refresh };
}
