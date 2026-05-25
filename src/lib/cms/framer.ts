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

type FramerCollection = {
  id: string;
  name?: string;
  addItems(items: unknown[]): Promise<void>;
};

async function openFramer(credentials: FramerCredentials) {
  return connect(credentials.projectUrl, credentials.apiKey);
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
    const itemId = input.existingRemoteId || `citepilot-${input.slug}`;
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

    await collection.addItems([
      {
        id: itemId,
        slug: input.slug,
        fieldData,
      },
    ]);

    const published = await framer.publish();
    await framer.deploy(published.deployment.id);
    const primaryHost = published.hostnames.find((item) => item.isPrimary)?.hostname;

    return {
      remoteId: itemId,
      liveUrl: hostnameToUrl(primaryHost),
    };
  } finally {
    await framer.disconnect();
  }
}
