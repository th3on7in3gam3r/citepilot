/** Env-gated seasonal / urgency campaign (off by default — draft/human review). */

/**
 * Bracket access so Next.js does not inline these at build time.
 * Dot access (`process.env.CAMPAIGN_ENABLED`) can bake "" into the server
 * bundle when the var was unset during `next build`, so later Render env
 * updates would never take effect until another rebuild.
 */
function campaignEnv(name: string): string | undefined {
  const raw = process.env[name];
  return typeof raw === "string" ? raw : undefined;
}

export function isCampaignEnabled(): boolean {
  const raw = campaignEnv("CAMPAIGN_ENABLED")?.trim().toLowerCase();
  return raw === "true" || raw === "1";
}

export function campaignCode(): string | null {
  const code = campaignEnv("CAMPAIGN_CODE")?.trim().toUpperCase();
  return code || null;
}

export function campaignLabel(): string {
  return (
    campaignEnv("CAMPAIGN_LABEL")?.trim() ||
    "Limited-time Pilot offer"
  );
}

export function campaignMessage(): string {
  return (
    campaignEnv("CAMPAIGN_MESSAGE")?.trim() ||
    campaignLabel()
  );
}

/** Parse CAMPAIGN_ENDS_AT ISO date; null if missing/invalid. */
export function campaignEndsAt(): Date | null {
  const raw = campaignEnv("CAMPAIGN_ENDS_AT")?.trim();
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

/** Active when enabled and not past end date (soft-fail on bad config). */
export function isCampaignActive(now: Date = new Date()): boolean {
  try {
    if (!isCampaignEnabled()) return false;
    const ends = campaignEndsAt();
    if (ends && now.getTime() >= ends.getTime()) return false;
    return true;
  } catch {
    return false;
  }
}

export type CampaignSnapshot = {
  active: boolean;
  code: string | null;
  message: string;
  endsAtIso: string | null;
};

export function getCampaignSnapshot(now: Date = new Date()): CampaignSnapshot {
  const active = isCampaignActive(now);
  const ends = campaignEndsAt();
  return {
    active,
    code: active ? campaignCode() : null,
    message: campaignMessage(),
    endsAtIso: ends ? ends.toISOString() : null,
  };
}
