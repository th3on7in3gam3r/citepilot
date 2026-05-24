"use client";

import { useWorkspace } from "@/hooks/useWorkspace";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import { createContext, useContext } from "react";

type WorkspaceContextValue = {
  workspace: WorkspaceSnapshot | null;
  ready: boolean;
  refresh: () => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const value = useWorkspace();
  return (
    <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
  );
}

export function useWorkspaceContext(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspaceContext must be used within WorkspaceProvider");
  }
  return ctx;
}
