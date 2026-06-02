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

type FramerCollection = {
  id: string;
  name?: string;
  getItems(): Promise<FramerCollectionItem[]>;
  addItems(items: unknown[]): Promise<void>;
};

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
  collectionId: string,
): Promise<FramerCollection> {
  const collections = (await framer.getCollections()) as FramerCollection[];
  const collection = collections.find((item) => item.id === collectionId);
  if (!collection) {
    throw new FramerApiError("Framer collection not found for this project", 404);
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
    const published = await framer.getPublishInfo();
    return {
      displayName: "Framer project",
      siteUrl:
        published.production?.url ||
        hostnameToUrl(published.staging?.url) ||
        credentials.projectUrl,
      detail: `Collection: ${collection.name || credentials.collectionId}`,
      remoteDefaults: {
        collectionName: collection.name || credentials.collectionId,
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
    const existingId = await resolveFramerItemId(
      collection,
      input.slug,
      input.existingRemoteId,
    );
    const fieldData: Record<string, { type: string; value: string }> = {
      [input.credentials.titleFieldId]: {
        type: "string",
        value: input.title,
      },
      [input.credentials.bodyFieldId]: {
        type: "formattedText",
        value: markdownToCmsHtml(input.markdown),
      },
    };

    if (input.credentials.summaryFieldId) {
      fieldData[input.credentials.summaryFieldId] = {
        type: "string",
        value: input.description,
      };
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
