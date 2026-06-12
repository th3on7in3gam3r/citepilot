import { connect } from "framer-api";
import { markdownToCmsHtml } from "@/lib/cms/markdown-to-html";
import type { FramerCredentials } from "@/lib/cms/types";

export class FramerApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type FramerCollectionItem = {
  id: string;
  slug: string;
};

type FramerField = {
  id: string;
  name?: string;
  type: string;
};

type FramerCollection = {
  id: string;
  name?: string;
  getItems(): Promise<FramerCollectionItem[]>;
  getFields(): Promise<FramerField[]>;
  addItems(items: unknown[]): Promise<void>;
};

function normalizeFieldKey(value: string): string {
  return value.trim().toLowerCase();
}

function resolveFramerField(
  fields: FramerField[],
  keyOrName: string,
  label: string,
): FramerField {
  const needle = normalizeFieldKey(keyOrName);
  const match =
    fields.find((field) => normalizeFieldKey(field.id) === needle) ??
    fields.find(
      (field) => field.name && normalizeFieldKey(field.name) === needle,
    );

  if (match) return match;

  const available = fields
    .map((field) => `${field.name ?? field.id} → id: ${field.id} (${field.type})`)
    .join("; ");

  throw new FramerApiError(
    `Framer ${label} field "${keyOrName}" not found. Available fields: ${available}`,
    400,
  );
}

function fieldPayload(
  field: FramerField,
  value: string,
): { type: string; value: string } {
  return { type: field.type, value };
}

async function resolveFramerFieldMap(
  collection: FramerCollection,
  credentials: FramerCredentials,
): Promise<{
  title: FramerField;
  body: FramerField;
  summary?: FramerField;
}> {
  const fields = await collection.getFields();
  const title = resolveFramerField(fields, credentials.titleFieldId, "title");
  const body = resolveFramerField(fields, credentials.bodyFieldId, "body");
  const summary = credentials.summaryFieldId
    ? resolveFramerField(fields, credentials.summaryFieldId, "summary")
    : undefined;

  return { title, body, summary };
}

async function openFramer(credentials: FramerCredentials) {
  return connect(credentials.projectUrl, credentials.apiKey);
}

async function resolveFramerItemId(
  collection: FramerCollection,
  slug: string,
  existingRemoteId?: string | null,
): Promise<string | undefined> {
  const items = await collection.getItems();
  if (existingRemoteId) {
    const byId = items.find((item) => item.id === existingRemoteId);
    if (byId) return byId.id;
  }
  return items.find((item) => item.slug === slug)?.id;
}

async function getFramerCollection(
  framer: Awaited<ReturnType<typeof openFramer>>,
  collectionIdOrName: string,
): Promise<FramerCollection> {
  const collections = (await framer.getCollections()) as FramerCollection[];
  const needle = collectionIdOrName.trim().toLowerCase();
  const collection = collections.find(
    (item) =>
      item.id === collectionIdOrName ||
      item.name?.trim().toLowerCase() === needle,
  );
  if (!collection) {
    const available = collections
      .map((item) => `${item.name ?? item.id} → id: ${item.id}`)
      .join("; ");
    throw new FramerApiError(
      `Framer collection "${collectionIdOrName}" not found. Available collections: ${available}`,
      404,
    );
  }
  return collection;
}

function hostnameToUrl(hostname: string | undefined): string | null {
  if (!hostname) return null;
  return hostname.startsWith("http") ? hostname : `https://${hostname}`;
}

export async function testFramerConnection(
  credentials: FramerCredentials,
): Promise<{
  displayName: string;
  siteUrl: string;
  detail: string;
  remoteDefaults: { collectionName: string };
}> {
  const framer = await openFramer(credentials);
  try {
    const collection = await getFramerCollection(framer, credentials.collectionId);
    const resolved = await resolveFramerFieldMap(collection, credentials);
    const published = await framer.getPublishInfo();
    const fieldSummary = [
      `${resolved.title.name ?? "title"} (${resolved.title.id})`,
      `${resolved.body.name ?? "body"} (${resolved.body.id})`,
      resolved.summary
        ? `${resolved.summary.name ?? "summary"} (${resolved.summary.id})`
        : null,
    ]
      .filter(Boolean)
      .join(", ");

    return {
      displayName: "Framer project",
      siteUrl:
        published.production?.url ||
        hostnameToUrl(published.staging?.url) ||
        credentials.projectUrl,
      detail: `Collection: ${collection.name || collection.id} · Fields: ${fieldSummary}`,
      remoteDefaults: {
        collectionName: collection.name || collection.id,
      },
    };
  } finally {
    await framer.disconnect();
  }
}

export async function publishPostToFramer(input: {
  credentials: FramerCredentials;
  title: string;
  slug: string;
  markdown: string;
  description: string;
  existingRemoteId?: string | null;
}): Promise<{ remoteId: string; liveUrl: string | null }> {
  const framer = await openFramer(input.credentials);
  try {
    const collection = await getFramerCollection(framer, input.credentials.collectionId);
    const resolved = await resolveFramerFieldMap(collection, input.credentials);
    const existingId = await resolveFramerItemId(
      collection,
      input.slug,
      input.existingRemoteId,
    );
    const bodyValue =
      resolved.body.type === "formattedText"
        ? markdownToCmsHtml(input.markdown)
        : input.markdown;

    const fieldData: Record<string, { type: string; value: string }> = {
      [resolved.title.id]: fieldPayload(resolved.title, input.title),
      [resolved.body.id]: fieldPayload(resolved.body, bodyValue),
    };

    if (resolved.summary) {
      fieldData[resolved.summary.id] = fieldPayload(
        resolved.summary,
        input.description,
      );
    }

    const itemPayload: {
      slug: string;
      fieldData: Record<string, { type: string; value: string }>;
      id?: string;
    } = {
      slug: input.slug,
      fieldData,
    };
    if (existingId) {
      itemPayload.id = existingId;
    }

    await collection.addItems([itemPayload]);

    const items = await collection.getItems();
    const saved = items.find((item) => item.slug === input.slug);
    if (!saved) {
      throw new FramerApiError(
        "Framer item was saved but could not be found by slug",
        500,
      );
    }

    const published = await framer.publish();
    await framer.deploy(published.deployment.id);
    const primaryHost = published.hostnames.find((item) => item.isPrimary)?.hostname;

    return {
      remoteId: saved.id,
      liveUrl: hostnameToUrl(primaryHost),
    };
  } finally {
    await framer.disconnect();
  }
}
