const RECENT_KEY = "citepilot_recent_workspaces";
const MAX_RECENT = 8;

export function recordRecentWorkspace(workspaceId: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    const next = [workspaceId, ...list.filter((id) => id !== workspaceId)].slice(
      0,
      MAX_RECENT,
    );
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function getRecentWorkspaceIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    return list.filter((id) => typeof id === "string");
  } catch {
    return [];
  }
}
