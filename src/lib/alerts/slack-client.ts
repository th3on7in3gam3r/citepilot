import { decryptSlackToken, type SlackConnectionRow } from "@/lib/alerts/store";

export type SlackChannel = {
  id: string;
  name: string;
  isPrivate: boolean;
};

async function slackApi<T>(
  token: string,
  method: string,
  body?: Record<string, unknown>,
): Promise<T & { ok: boolean; error?: string }> {
  const res = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json() as Promise<T & { ok: boolean; error?: string }>;
}

export async function exchangeSlackCode(code: string, redirectUri: string) {
  const clientId = process.env.SLACK_CLIENT_ID!.trim();
  const clientSecret = process.env.SLACK_CLIENT_SECRET!.trim();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
  });
  const res = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  return res.json() as Promise<{
    ok: boolean;
    error?: string;
    access_token?: string;
    team?: { id: string; name: string };
    bot_user_id?: string;
  }>;
}

export async function listSlackChannels(
  connection: SlackConnectionRow,
): Promise<SlackChannel[]> {
  const token = decryptSlackToken(connection);
  const channels: SlackChannel[] = [];
  let cursor: string | undefined;

  do {
    const data = await slackApi<{
      channels?: { id: string; name: string; is_private?: boolean }[];
      response_metadata?: { next_cursor?: string };
    }>(token, "conversations.list", {
      types: "public_channel,private_channel",
      exclude_archived: true,
      limit: 200,
      cursor,
    });

    if (!data.ok) {
      throw new Error(data.error ?? "Failed to list Slack channels");
    }

    for (const ch of data.channels ?? []) {
      channels.push({
        id: ch.id,
        name: ch.name,
        isPrivate: Boolean(ch.is_private),
      });
    }
    cursor = data.response_metadata?.next_cursor || undefined;
  } while (cursor);

  return channels.sort((a, b) => a.name.localeCompare(b.name));
}

export async function postSlackMessage(input: {
  connection: SlackConnectionRow;
  blocks: unknown[];
  text: string;
  channelId?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const channel =
    input.channelId ?? input.connection.slack_channel_id ?? undefined;
  if (!channel) {
    return { ok: false, error: "no_channel" };
  }

  const token = decryptSlackToken(input.connection);
  const data = await slackApi<{ ok: boolean; error?: string }>(
    token,
    "chat.postMessage",
    {
      channel,
      text: input.text,
      blocks: input.blocks,
      unfurl_links: false,
    },
  );
  return { ok: data.ok, error: data.error };
}
