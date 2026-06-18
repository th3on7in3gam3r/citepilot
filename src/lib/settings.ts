import {
  DEFAULT_PRIMARY_COLOR,
  type WhiteLabelPoweredByMode,
} from "@/lib/white-label/types";

export type WhiteLabelPreferences = {
  agencyName: string;
  logoUrl: string;
  /** @deprecated use poweredByMode */
  hidePoweredBy: boolean;
  poweredByMode: WhiteLabelPoweredByMode;
  primaryColor: string;
  customReportDomain: string;
  customDomainVerified: boolean;
  emailFromName: string;
  replyToEmail: string;
};

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

export type ScanScheduleFrequency = "weekly" | "biweekly" | "monthly";
export type ScanScheduleHour = 6 | 8 | 10 | 12;

export type ScanSchedulePreferences = {
  frequency: ScanScheduleFrequency;
  /** 0=Sunday … 6=Saturday */
  dayOfWeek: number;
  hour: ScanScheduleHour;
  /** IANA timezone, e.g. America/New_York */
  timezone: string;
};

export const defaultScanSchedulePreferences: ScanSchedulePreferences = {
  frequency: "weekly",
  dayOfWeek: 1,
  hour: 8,
  timezone: "UTC",
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
  /** Fleet: require all workspace members to enable 2FA */
  require2faForMembers: boolean;
  autopilot: AutopilotPreferences;
  /** Paid monitoring — one prompt per line; falls back to buyer question when empty */
  monitoredPrompts: string[];
  whiteLabel: WhiteLabelPreferences;
  /** @deprecated Use geoSnippetFixes — kept for migration only */
  appliedFixes: string[];
  /** JSON-LD blocks included in the hosted GEO snippet script */
  geoSnippetFixes: string[];
  /** Automatic scan schedule (Pilot+) */
  scanSchedule: ScanSchedulePreferences;
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
  require2faForMembers: false,
  autopilot: { ...defaultAutopilotPreferences },
  monitoredPrompts: [],
  whiteLabel: {
    agencyName: "",
    logoUrl: "",
    hidePoweredBy: false,
    poweredByMode: "agency_via_citepilot",
    primaryColor: DEFAULT_PRIMARY_COLOR,
    customReportDomain: "",
    customDomainVerified: false,
    emailFromName: "",
    replyToEmail: "",
  },
  appliedFixes: [],
  geoSnippetFixes: [],
  scanSchedule: { ...defaultScanSchedulePreferences },
};

function normalizeScanSchedule(
  raw: Partial<ScanSchedulePreferences> | undefined,
): ScanSchedulePreferences {
  const base = defaultScanSchedulePreferences;
  const frequency =
    raw?.frequency === "biweekly" ||
    raw?.frequency === "monthly" ||
    raw?.frequency === "weekly"
      ? raw.frequency
      : base.frequency;
  const dayOfWeek =
    typeof raw?.dayOfWeek === "number" && raw.dayOfWeek >= 0 && raw.dayOfWeek <= 6
      ? raw.dayOfWeek
      : base.dayOfWeek;
  const hour =
    raw?.hour === 6 || raw?.hour === 8 || raw?.hour === 10 || raw?.hour === 12
      ? raw.hour
      : base.hour;
  const timezone =
    typeof raw?.timezone === "string" && raw.timezone.trim()
      ? raw.timezone.trim()
      : base.timezone;
  return { frequency, dayOfWeek, hour, timezone };
}

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
      require2faForMembers:
        parsed.require2faForMembers ??
        defaultWorkspacePreferences.require2faForMembers,
      autopilot: {
        ...defaultAutopilotPreferences,
        ...(parsed.autopilot ?? {}),
      },
      monitoredPrompts: Array.isArray(parsed.monitoredPrompts)
        ? parsed.monitoredPrompts.filter((p): p is string => typeof p === "string")
        : defaultWorkspacePreferences.monitoredPrompts,
      whiteLabel: normalizeWhiteLabelPreferences(
        parsed.whiteLabel as Partial<WhiteLabelPreferences> | undefined,
      ),
      appliedFixes: Array.isArray(parsed.appliedFixes)
        ? parsed.appliedFixes.filter((f): f is string => typeof f === "string")
        : defaultWorkspacePreferences.appliedFixes,
      geoSnippetFixes: Array.isArray(parsed.geoSnippetFixes)
        ? parsed.geoSnippetFixes.filter((f): f is string => typeof f === "string")
        : Array.isArray(parsed.appliedFixes)
          ? parsed.appliedFixes.filter((f): f is string => typeof f === "string")
          : defaultWorkspacePreferences.geoSnippetFixes,
      scanSchedule: normalizeScanSchedule(parsed.scanSchedule),
    };
  } catch {
    return { ...defaultWorkspacePreferences };
  }
}

function normalizeWhiteLabelPreferences(
  raw: Partial<WhiteLabelPreferences> | undefined,
): WhiteLabelPreferences {
  const merged = {
    ...defaultWorkspacePreferences.whiteLabel,
    ...(raw ?? {}),
  };

  const poweredByMode: WhiteLabelPoweredByMode =
    merged.poweredByMode === "agency_primary" ||
    merged.poweredByMode === "agency_via_citepilot"
      ? merged.poweredByMode
      : merged.hidePoweredBy
        ? "agency_primary"
        : "agency_via_citepilot";

  const primaryColor =
    typeof merged.primaryColor === "string" && merged.primaryColor.trim()
      ? merged.primaryColor.trim()
      : DEFAULT_PRIMARY_COLOR;

  return {
    ...merged,
    poweredByMode,
    primaryColor,
    customReportDomain: merged.customReportDomain?.trim() ?? "",
    customDomainVerified: Boolean(merged.customDomainVerified),
    emailFromName: merged.emailFromName?.trim() ?? "",
    replyToEmail: merged.replyToEmail?.trim() ?? "",
    hidePoweredBy: poweredByMode === "agency_primary",
  };
}

export function mergePreferences(
  current: WorkspacePreferences,
  patch: Partial<Omit<WorkspacePreferences, "whiteLabel">> & {
    whiteLabel?: Partial<WhiteLabelPreferences>;
  },
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
    scanSchedule: patch.scanSchedule
      ? normalizeScanSchedule({ ...current.scanSchedule, ...patch.scanSchedule })
      : current.scanSchedule,
  };
}
