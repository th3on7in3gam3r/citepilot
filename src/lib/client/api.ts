import type {
  AuditPayload,
  WorkspaceSnapshotResponse,
  WorkspaceUpdateInput,
} from "@/lib/api-types";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import type { OnboardingAnswers } from "@/lib/onboarding";
import { ONBOARDING_STORAGE_KEY } from "@/lib/onboarding";
import { WORKSPACE_STORAGE_KEY } from "@/lib/constants";

const fetchOpts: RequestInit = { credentials: "include" };

export function normalizeSnapshot(
  data: WorkspaceSnapshotResponse,
  workspaceId: string,
): WorkspaceSnapshot {
  return {
    ...data,
    workspaceId,
    id: data.id,
    promptResults: data.promptResults ?? [],
    platformPresence: data.platformPresence ?? [],
  };
}

export async function createWorkspaceFromOnboarding(
  answers: OnboardingAnswers,
): Promise<{ id: string; workspace: WorkspaceSnapshotResponse } | null> {
  const res = await fetch("/api/workspaces", {
    ...fetchOpts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(answers),
  });
  if (res.status === 401) return null;
  if (!res.ok) return null;
  const data = (await res.json()) as {
    id: string;
    workspace: WorkspaceSnapshotResponse;
  };
  localStorage.setItem(WORKSPACE_STORAGE_KEY, data.id);
  return data;
}

export async function fetchWorkspace(
  id: string,
): Promise<WorkspaceSnapshotResponse | null> {
  const res = await fetch(`/api/workspaces/${id}`, fetchOpts);
  if (res.status === 401) return null;
  if (!res.ok) return null;
  const data = (await res.json()) as { workspace: WorkspaceSnapshotResponse };
  return data.workspace;
}

export async function fetchDefaultWorkspace(): Promise<{
  id: string;
  workspace: WorkspaceSnapshotResponse;
} | null> {
  const res = await fetch("/api/workspaces", fetchOpts);
  if (res.status === 401) return null;
  if (!res.ok) return null;
  const data = (await res.json()) as {
    workspaces: { id: string; workspace: WorkspaceSnapshotResponse }[];
  };
  const first = data.workspaces[0];
  if (!first) return null;
  return first;
}

export async function updateWorkspace(
  id: string,
  updates: WorkspaceUpdateInput,
): Promise<WorkspaceSnapshotResponse | null> {
  const res = await fetch(`/api/workspaces/${id}`, {
    ...fetchOpts,
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (res.status === 401) return null;
  if (!res.ok) return null;
  const data = (await res.json()) as { workspace: WorkspaceSnapshotResponse };
  return data.workspace;
}

export async function deleteWorkspace(id: string): Promise<boolean> {
  const res = await fetch(`/api/workspaces/${id}`, {
    ...fetchOpts,
    method: "DELETE",
  });
  if (res.ok) {
    localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    sessionStorage.removeItem(ONBOARDING_STORAGE_KEY);
  }
  return res.ok;
}

export async function runAudit(input: {
  domain: string;
  prompts: string[];
  workspaceId?: string;
}): Promise<AuditPayload> {
  const res = await fetch("/api/audit", {
    ...fetchOpts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Audit failed");
  }
  return res.json() as Promise<AuditPayload>;
}

export async function joinWaitlist(email: string): Promise<boolean> {
  const res = await fetch("/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.ok;
}

export function getStoredWorkspaceId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(WORKSPACE_STORAGE_KEY);
}

export function clearStoredWorkspaceId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(WORKSPACE_STORAGE_KEY);
}

export function storeWorkspaceId(id: string): void {
  localStorage.setItem(WORKSPACE_STORAGE_KEY, id);
}
