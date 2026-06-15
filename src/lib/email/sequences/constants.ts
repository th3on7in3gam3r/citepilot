import type { EmailSequenceName, SequenceScheduleEntry } from "./types";

export const SEQUENCE_SCHEDULES: Record<
  EmailSequenceName,
  SequenceScheduleEntry[]
> = {
  free_onboarding: [
    { emailNumber: 1, delayDays: 0 },
    { emailNumber: 2, delayDays: 2 },
    { emailNumber: 3, delayDays: 5 },
  ],
  post_audit: [
    { emailNumber: 1, delayDays: 0 },
    { emailNumber: 2, delayDays: 3 },
  ],
  pilot_retention: [
    { emailNumber: 1, delayDays: 0 },
    { emailNumber: 2, delayDays: 7 },
    { emailNumber: 3, delayDays: 25 },
  ],
  churn_prevention: [
    { emailNumber: 1, delayDays: 0 },
    { emailNumber: 2, delayDays: 3 },
  ],
};

export const PILOT_PRICE_LABEL = "$79/mo";
