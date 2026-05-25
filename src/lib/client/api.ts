import type {
  AuditPayload,
  WorkspaceSnapshotResponse,
  WorkspaceUpdateInput,
} from "@/lib/api-types";
import type { WorkspaceLimits } from "@/lib/billing/limits";
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

export type WorkspaceListResponse = {
  workspaces: {
    id: string;
    domain: string;
    businessType: string;
    buyerQuestion: string;
    updatedAt: string;
    citationScore: number;
    hasRealAudit: boolean;
    workspace: WorkspaceSnapshotResponse;
  }[];
  limits: WorkspaceLimits;
};

export async function fetchWorkspacesList(): Promise<WorkspaceListResponse | null> {
  const res = await fetch("/api/workspaces", fetchOpts);
  if (res.status === 401) return null;
  if (!res.ok) return null;
  return res.json() as Promise<WorkspaceListResponse>;
}

export async function fetchDefaultWorkspace(): Promise<{
  id: string;
  workspace: WorkspaceSnapshotResponse;
} | null> {
  const list = await fetchWorkspacesList();
  const first = list?.workspaces[0];
  if (!first) return null;
  return { id: first.id, workspace: first.workspace };
}

export async function createClientWorkspace(input: {
  domain: string;
  buyerQuestion: string;
  description?: string;
  businessType?: string;
}): Promise<{
  id?: string;
  workspace?: WorkspaceSnapshotResponse;
  limits?: WorkspaceLimits;
  error?: string;
}> {
  const res = await fetch("/api/workspaces", {
    ...fetchOpts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      domain: input.domain,
      buyerQuestion: input.buyerQuestion,
      description: input.description ?? "",
      businessType: input.businessType ?? "agency-client",
      audiences: [],
      competitors: [],
      referral: "",
    }),
  });
  const data = (await res.json()) as {
    id?: string;
    workspace?: WorkspaceSnapshotResponse;
    limits?: WorkspaceLimits;
    error?: string;
  };
  if (!res.ok) {
    return { error: data.error ?? "Could not create workspace" };
  }
  if (data.id) {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, data.id);
  }
  return data;
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
  const data = (await res.json().catch(() => ({}))) as {
    workspace?: WorkspaceSnapshotResponse;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error ?? `Could not save workspace (${res.status})`);
  }
  return data.workspace ?? null;
}

export async function deleteWorkspace(id: string): Promise<boolean> {
  const res = await fetch(`/api/workspaces/${id}`, {
    ...fetchOpts,
    method: "DELETE",
  });
  if (res.ok) {
    const list = await fetchWorkspacesList();
    const next = list?.workspaces.find((w) => w.id !== id);
    if (next) {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, next.id);
    } else {
      localStorage.removeItem(WORKSPACE_STORAGE_KEY);
      sessionStorage.removeItem(ONBOARDING_STORAGE_KEY);
    }
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
