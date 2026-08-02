import { appBaseUrl } from "@/lib/stripe/config";

export const SLACK_SCOPES = [
  "channels:read",
  "groups:read",
  "chat:write",
  "chat:write.public",
].join(",");

export function isSlackConfigured(): boolean {
  return Boolean(
    process.env.SLACK_CLIENT_ID?.trim() &&
      process.env.SLACK_CLIENT_SECRET?.trim(),
  );
}

export function slackRedirectUri(): string {
  return `${appBaseUrl()}/api/integrations/slack/callback`;
}

export function buildSlackOAuthUrl(state: string): string {
  const clientId = process.env.SLACK_CLIENT_ID!.trim();
  const params = new URLSearchParams({
    client_id: clientId,
    scope: SLACK_SCOPES,
    redirect_uri: slackRedirectUri(),
    state,
  });
  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}
