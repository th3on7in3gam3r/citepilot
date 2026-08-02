/** Default landing path after sign-in / sign-up when no explicit `from` is set. */
export const DEFAULT_POST_AUTH_PATH = "/start";

/** Safe internal redirect — rejects protocol-relative and external URLs. */
export function resolveAuthRedirect(from: string | null | undefined): string {
  if (from && from.startsWith("/") && !from.startsWith("//")) {
    return from;
  }
  return DEFAULT_POST_AUTH_PATH;
}

/** Build `/start` with optional domain pre-fill for onboarding. */
export function buildStartRedirect(domain?: string | null): string {
  const trimmed = domain?.trim();
  if (!trimmed) return DEFAULT_POST_AUTH_PATH;
  return `${DEFAULT_POST_AUTH_PATH}?domain=${encodeURIComponent(trimmed)}`;
}
