export function googleClientId(): string | null {
  return process.env.GOOGLE_CLIENT_ID?.trim() || null;
}

export function googleClientSecret(): string | null {
  return process.env.GOOGLE_CLIENT_SECRET?.trim() || null;
}

export function isGscConfigured(): boolean {
  return Boolean(googleClientId() && googleClientSecret());
}

export const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
