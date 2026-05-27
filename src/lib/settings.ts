export type WorkspacePreferences = {
  weeklyDigest: boolean;
  auditCompleteEmail: boolean;
  discussionAlerts: boolean;
  scoreDropAlerts: boolean;
  monitoringEmail: string;
  /** Paid monitoring — one prompt per line; falls back to buyer question when empty */
  monitoredPrompts: string[];
  whiteLabel: {
    agencyName: string;
    logoUrl: string;
    hidePoweredBy: boolean;
  };
};

export const defaultWorkspacePreferences: WorkspacePreferences = {
  weeklyDigest: true,
  auditCompleteEmail: true,
  discussionAlerts: false,
  scoreDropAlerts: true,
  monitoringEmail: "",
  monitoredPrompts: [],
  whiteLabel: {
    agencyName: "",
    logoUrl: "",
    hidePoweredBy: false,
  },
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
      scoreDropAlerts:
        parsed.scoreDropAlerts ?? defaultWorkspacePreferences.scoreDropAlerts,
      monitoredPrompts: Array.isArray(parsed.monitoredPrompts)
        ? parsed.monitoredPrompts.filter((p): p is string => typeof p === "string")
        : defaultWorkspacePreferences.monitoredPrompts,
      whiteLabel: {
        ...defaultWorkspacePreferences.whiteLabel,
        ...(parsed.whiteLabel ?? {}),
      },
    };
  } catch {
    return { ...defaultWorkspacePreferences };
  }
}

export function mergePreferences(
  current: WorkspacePreferences,
  patch: Partial<WorkspacePreferences>,
): WorkspacePreferences {
  return {
    ...current,
    ...patch,
    monitoredPrompts: patch.monitoredPrompts ?? current.monitoredPrompts,
    whiteLabel: patch.whiteLabel
      ? { ...current.whiteLabel, ...patch.whiteLabel }
      : current.whiteLabel,
  };
}
