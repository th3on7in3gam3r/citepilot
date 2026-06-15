export const UPGRADE_MODAL_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEY = "citepilot_upgrade_modal_dismissed_at";

export function upgradeModalCooldownActive(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const dismissedAt = Number(raw);
    if (!Number.isFinite(dismissedAt)) return false;
    return Date.now() - dismissedAt < UPGRADE_MODAL_COOLDOWN_MS;
  } catch {
    return false;
  }
}

export function markUpgradeModalDismissed(): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function clearUpgradeModalCooldown(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
