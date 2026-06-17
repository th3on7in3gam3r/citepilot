export type EmailSequenceName =
  | "free_onboarding"
  | "post_audit"
  | "pilot_retention"
  | "churn_prevention";

export type GapFixType = "schema" | "content" | "entity";

export type SequenceEmailPayload = {
  domain?: string;
  workspaceId?: string;
  auditId?: string;
  score?: number;
  cited?: number;
  total?: number;
  topGap?: string;
  gapFixType?: GapFixType;
  shareUrl?: string;
  scorePageUrl?: string;
  userName?: string;
};

export type SendSequenceInput = {
  sequence: EmailSequenceName;
  userId: string;
  data?: SequenceEmailPayload;
  /** Send a single email in the sequence (optional). */
  emailNumber?: number;
};

export type SequenceScheduleEntry = {
  emailNumber: number;
  delayDays: number;
};
