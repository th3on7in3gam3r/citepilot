import type { HashnodeCredentials } from "@/lib/cms/types";

const HASHNODE_GQL_URL = "https://gql.hashnode.com";

export class HashnodeApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Extract a 24-char publication ObjectId from raw input or dashboard URLs. */
export function normalizeHashnodePublicationId(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const fromDashboards = trimmed.match(/dashboards\/([a-f0-9]{24})/i);
  if (fromDashboards?.[1]) return fromDashboards[1];

  const fromLegacyDashboard = trimmed.match(
    /hashnode\.com\/([a-f0-9]{24})\/dashboard/i,
  );
  if (fromLegacyDashboard?.[1]) return fromLegacyDashboard[1];

  const fromRaw = trimmed.match(/^([a-f0-9]{24})$/i);
  if (fromRaw?.[1]) return fromRaw[1];

  const fromAnyUrl = trimmed.match(/([a-f0-9]{24})/i);
  if (fromAnyUrl?.[1]) return fromAnyUrl[1];

  return trimmed;
}

function normalizedCredentials(
  credentials: HashnodeCredentials,
): HashnodeCredentials {
  return {
    ...credentials,
    publicationId: normalizeHashnodePublicationId(credentials.publicationId),
  };
}

const HASHNODE_PRO_MESSAGE =
  "Hashnode's GraphQL API now requires Hashnode Pro on your publication. Upgrade in your blog dashboard → Billing → Upgrade to Pro, then reconnect. See hashnode.com/changelog/2026-05-13-graphql-api-paid-access";

type GqlResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

function isHtmlResponse(text: string): boolean {
  const start = text.trimStart().slice(0, 64).toLowerCase();
  return start.startsWith("<!doctype") || start.startsWith("<html");
}

async function hashnodeRequest<T>(
  credentials: HashnodeCredentials,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const token = credentials.accessToken.trim();
  if (!token) {
    throw new HashnodeApiError(
      "Personal access token is required. Generate one at hashnode.com/settings/developer.",
      400,
    );
  }

  const res = await fetch(HASHNODE_GQL_URL, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (res.status >= 300 && res.status < 400) {
    throw new HashnodeApiError(HASHNODE_PRO_MESSAGE, 402);
  }

  const text = await res.text();
  if (isHtmlResponse(text)) {
    throw new HashnodeApiError(HASHNODE_PRO_MESSAGE, 402);
  }

  let body: GqlResponse<T>;
  try {
    body = JSON.parse(text) as GqlResponse<T>;
  } catch {
    throw new HashnodeApiError(
      `Hashnode returned an unexpected response: ${text.slice(0, 180)}`,
      502,
    );
  }

  if (body.errors?.length) {
    const message = body.errors.map((error) => error.message).join("; ");
    const status = message.toLowerCase().includes("not found") ? 404 : 400;
    throw new HashnodeApiError(message, res.ok ? status : Math.min(502, res.status || 502));
  }

  if (!res.ok) {
    throw new HashnodeApiError(`Hashnode request failed (${res.status})`, res.status);
  }

  if (!body.data) {
    throw new HashnodeApiError("Hashnode returned no data", 502);
  }

  return body.data;
}

export async function testHashnodeConnection(
  credentials: HashnodeCredentials,
): Promise<{ displayName: string; siteUrl: string; detail: string }> {
  const publicationId = normalizeHashnodePublicationId(credentials.publicationId);
  if (!publicationId) {
    throw new HashnodeApiError(
      "Publication ID is required. Paste the ID from hashnode.com/dashboards/{id} or just the 24-character ID.",
      400,
    );
  }
  if (!/^[a-f0-9]{24}$/i.test(publicationId)) {
    throw new HashnodeApiError(
      "Publication ID looks invalid. Copy it from hashnode.com/dashboards/{your-id} — it should be a 24-character hex string.",
      400,
    );
  }

  const data = await hashnodeRequest<{
    publication: {
      id: string;
      title: string;
      displayTitle: string | null;
      url: string;
    } | null;
  }>(
    normalizedCredentials({ ...credentials, publicationId }),
    `query Publication($id: ObjectId!) {
      publication(id: $id) {
        id
        title
        displayTitle
        url
      }
    }`,
    { id: publicationId },
  );

  const publication = data.publication;
  if (!publication) {
    throw new HashnodeApiError(
      "Publication not found. Check your Publication ID and ensure the access token belongs to this blog.",
      404,
    );
  }

  return {
    displayName:
      publication.displayTitle?.trim() ||
      publication.title?.trim() ||
      "Hashnode publication",
    siteUrl: publication.url,
    detail: "Hashnode GraphQL API verified",
  };
}

function publishInput(input: {
  credentials: HashnodeCredentials;
  title: string;
  slug: string;
  markdown: string;
  description: string;
}) {
  const subtitle = input.description.trim().slice(0, 280);
  const metaDescription = input.description.trim().slice(0, 320);

  return {
    title: input.title,
    slug: input.slug,
    publicationId: normalizeHashnodePublicationId(input.credentials.publicationId),
    contentMarkdown: input.markdown,
    ...(subtitle ? { subtitle } : {}),
    ...(metaDescription
      ? { metaTags: { title: input.title, description: metaDescription } }
      : {}),
  };
}

async function createHashnodePost(input: {
  credentials: HashnodeCredentials;
  title: string;
  slug: string;
  markdown: string;
  description: string;
}): Promise<{ remoteId: string; liveUrl: string | null }> {
  const credentials = normalizedCredentials(input.credentials);
  const data = await hashnodeRequest<{
    publishPost: { post: { id: string; url: string | null } | null } | null;
  }>(
    credentials,
    `mutation PublishPost($input: PublishPostInput!) {
      publishPost(input: $input) {
        post {
          id
          url
        }
      }
    }`,
    { input: publishInput({ ...input, credentials }) },
  );

  const post = data.publishPost?.post;
  if (!post?.id) {
    throw new HashnodeApiError("Hashnode publish failed", 500);
  }

  return { remoteId: post.id, liveUrl: post.url ?? null };
}

async function updateHashnodePost(input: {
  credentials: HashnodeCredentials;
  remoteId: string;
  title: string;
  slug: string;
  markdown: string;
  description: string;
}): Promise<{ remoteId: string; liveUrl: string | null }> {
  const credentials = normalizedCredentials(input.credentials);
  const subtitle = input.description.trim().slice(0, 280);
  const metaDescription = input.description.trim().slice(0, 320);

  const data = await hashnodeRequest<{
    updatePost: { post: { id: string; url: string | null } | null } | null;
  }>(
    credentials,
    `mutation UpdatePost($input: UpdatePostInput!) {
      updatePost(input: $input) {
        post {
          id
          url
        }
      }
    }`,
    {
      input: {
        id: input.remoteId,
        title: input.title,
        slug: input.slug,
        contentMarkdown: input.markdown,
        publicationId: credentials.publicationId,
        ...(subtitle ? { subtitle } : {}),
        ...(metaDescription
          ? { metaTags: { title: input.title, description: metaDescription } }
          : {}),
      },
    },
  );

  const post = data.updatePost?.post;
  if (!post?.id) {
    throw new HashnodeApiError("Hashnode update failed", 500);
  }

  return { remoteId: post.id, liveUrl: post.url ?? null };
}

export async function publishPostToHashnode(input: {
  credentials: HashnodeCredentials;
  title: string;
  slug: string;
  markdown: string;
  description: string;
  existingRemoteId?: string | null;
}): Promise<{ remoteId: string; liveUrl: string | null }> {
  if (input.existingRemoteId) {
    try {
      return await updateHashnodePost({
        credentials: normalizedCredentials(input.credentials),
        remoteId: input.existingRemoteId,
        title: input.title,
        slug: input.slug,
        markdown: input.markdown,
        description: input.description,
      });
    } catch (error) {
      if (!(error instanceof HashnodeApiError) || error.status !== 404) {
        throw error;
      }
    }
  }

  return createHashnodePost({
    ...input,
    credentials: normalizedCredentials(input.credentials),
  });
}
