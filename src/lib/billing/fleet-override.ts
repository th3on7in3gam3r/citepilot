import { getSessionUser } from "@/lib/auth/server";

/**
 * Temporary server-only Fleet QA override.
 * Never import from Client Components or expose via NEXT_PUBLIC_*.
 * Remove HARDCODED_FLEET_QA_EMAILS after Fleet testing is done.
 *
 * Extra emails can be added without a code change via:
 *   FLEET_OVERRIDE_EMAILS=someone@example.com,other@example.com
 */
const HARDCODED_FLEET_QA_EMAILS = ["jerlessm@gmail.com"] as const;

export function isFleetOverrideEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (
    HARDCODED_FLEET_QA_EMAILS.some((allowed) => allowed.toLowerCase() === normalized)
  ) {
    return true;
  }
  const fromEnv =
    process.env.FLEET_OVERRIDE_EMAILS?.split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean) ?? [];
  return fromEnv.includes(normalized);
}

/**
 * True only when the authenticated session belongs to `userId`
 * and that session’s email is on the Fleet override allowlist.
 */
export async function userHasFleetOverride(
  userId: string | null,
): Promise<boolean> {
  if (!userId) return false;
  const session = await getSessionUser();
  if (!session?.id || session.id !== userId) return false;
  return isFleetOverrideEmail(session.email);
}
