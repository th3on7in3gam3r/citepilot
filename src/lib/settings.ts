export type AutopilotPreferences = {
  /** Master switch — weekly rescan + optional Autopilot email (Pilot+) */
  enabled: boolean;
  /** Email after Autopilot runs: delta summary + prioritized plan + proof link */
  emailReport: boolean;
  /** Generate CitePilot Insights prioritize plan when Autopilot runs */
  autoInsights: boolean;
};

export const defaultAutopilotPreferences: AutopilotPreferences = {
  enabled: false,
  emailReport: true,
  autoInsights: true,
};

export type ScoreDropThresholdPercent = 5 | 10 | 20;

export type WorkspacePreferences = {
  weeklyDigest: boolean;
  /** 0=Sunday … 6=Saturday (UTC) — when weekly digest email/Slack fires */
  weeklyDigestDay: number;
  auditCompleteEmail: boolean;
  discussionAlerts: boolean;
  scoreDropAlerts: boolean;
  /** Percentage-point drop in citation score that triggers an alert */
  scoreDropThresholdPercent: ScoreDropThresholdPercent;
  competitorMoveAlerts: boolean;
  /** Email proof report + client share link after weekly re-scan (Pilot+) */
  proofReportEmail: boolean;
  monitoringEmail: string;
  /** One-time explain-gap Insight on Free (per workspace) */
  freeExplainGapUsed: boolean;
  autopilot: AutopilotPreferences;
  /** Paid monitoring — one prompt per line; falls back to buyer question when empty */
  monitoredPrompts: string[];
  whiteLabel: {
    agencyName: string;
    logoUrl: string;
    hidePoweredBy: boolean;
  };
  /** @deprecated Use geoSnippetFixes — kept for migration only */
  appliedFixes: string[];
  /** JSON-LD blocks included in the hosted GEO snippet script */
  geoSnippetFixes: string[];
};

export const defaultWorkspacePreferences: WorkspacePreferences = {
  weeklyDigest: true,
  weeklyDigestDay: 1,
  auditCompleteEmail: true,
  discussionAlerts: false,
  scoreDropAlerts: true,
  scoreDropThresholdPercent: 5,
  competitorMoveAlerts: true,
  proofReportEmail: true,
  monitoringEmail: "",
  freeExplainGapUsed: false,
  autopilot: { ...defaultAutopilotPreferences },
  monitoredPrompts: [],
  whiteLabel: {
    agencyName: "",
    logoUrl: "",
    hidePoweredBy: false,
  },
  appliedFixes: [],
  geoSnippetFixes: [],
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
      scoreDropThresholdPercent: [5, 10, 20].includes(
        parsed.scoreDropThresholdPercent as number,
      )
        ? (parsed.scoreDropThresholdPercent as ScoreDropThresholdPercent)
        : defaultWorkspacePreferences.scoreDropThresholdPercent,
      weeklyDigestDay:
        typeof parsed.weeklyDigestDay === "number" &&
        parsed.weeklyDigestDay >= 0 &&
        parsed.weeklyDigestDay <= 6
          ? parsed.weeklyDigestDay
          : defaultWorkspacePreferences.weeklyDigestDay,
      competitorMoveAlerts:
        parsed.competitorMoveAlerts ??
        defaultWorkspacePreferences.competitorMoveAlerts,
      proofReportEmail:
        parsed.proofReportEmail ?? defaultWorkspacePreferences.proofReportEmail,
      freeExplainGapUsed:
        parsed.freeExplainGapUsed ??
        defaultWorkspacePreferences.freeExplainGapUsed,
      autopilot: {
        ...defaultAutopilotPreferences,
        ...(parsed.autopilot ?? {}),
      },
      monitoredPrompts: Array.isArray(parsed.monitoredPrompts)
        ? parsed.monitoredPrompts.filter((p): p is string => typeof p === "string")
        : defaultWorkspacePreferences.monitoredPrompts,
      whiteLabel: {
        ...defaultWorkspacePreferences.whiteLabel,
        ...(parsed.whiteLabel ?? {}),
      },
      appliedFixes: Array.isArray(parsed.appliedFixes)
        ? parsed.appliedFixes.filter((f): f is string => typeof f === "string")
        : defaultWorkspacePreferences.appliedFixes,
      geoSnippetFixes: Array.isArray(parsed.geoSnippetFixes)
        ? parsed.geoSnippetFixes.filter((f): f is string => typeof f === "string")
        : Array.isArray(parsed.appliedFixes)
          ? parsed.appliedFixes.filter((f): f is string => typeof f === "string")
          : defaultWorkspacePreferences.geoSnippetFixes,
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
    autopilot: patch.autopilot
      ? { ...current.autopilot, ...patch.autopilot }
      : current.autopilot,
    whiteLabel: patch.whiteLabel
      ? { ...current.whiteLabel, ...patch.whiteLabel }
      : current.whiteLabel,
    appliedFixes: patch.appliedFixes ?? current.appliedFixes,
    geoSnippetFixes: patch.geoSnippetFixes ?? current.geoSnippetFixes,
  };
}
