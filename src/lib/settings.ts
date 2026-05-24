export type WorkspacePreferences = {
  weeklyDigest: boolean;
  auditCompleteEmail: boolean;
  discussionAlerts: boolean;
  monitoringEmail: string;
};

export const defaultWorkspacePreferences: WorkspacePreferences = {
  weeklyDigest: true,
  auditCompleteEmail: true,
  discussionAlerts: false,
  monitoringEmail: "",
};

export function parsePreferences(raw: string | null | undefined): WorkspacePreferences {
  if (!raw) return { ...defaultWorkspacePreferences };
  try {
    const parsed = JSON.parse(raw) as Partial<
      WorkspacePreferences & { redditAlerts?: boolean }
    >;
    return {
      ...defaultWorkspacePreferences,
      ...parsed,
      discussionAlerts:
        parsed.discussionAlerts ??
        parsed.redditAlerts ??
        defaultWorkspacePreferences.discussionAlerts,
    };
  } catch {
    return { ...defaultWorkspacePreferences };
  }
}

export function mergePreferences(
  current: WorkspacePreferences,
  patch: Partial<WorkspacePreferences>,
): WorkspacePreferences {
  return { ...current, ...patch };
}
