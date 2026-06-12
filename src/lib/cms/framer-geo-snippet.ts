import { connect } from "framer-api";
import {
  geoSnippetBlockHtml,
  mergeGeoSnippetIntoHtml,
  stripGeoSnippetFromHtml,
} from "@/lib/geo/snippet";
import type { FramerCredentials } from "@/lib/cms/types";

export class FramerGeoSnippetError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type FramerCustomCodeLocation = "headStart" | "headEnd" | "bodyStart" | "bodyEnd";

type FramerCustomCode = Record<
  FramerCustomCodeLocation,
  {
    disabled: boolean;
    html: string | null;
  }
>;

export async function applyGeoSnippetToFramer(input: {
  credentials: FramerCredentials;
  workspaceId: string;
  publish?: boolean;
}): Promise<{ published: boolean; detail: string }> {
  const framer = await connect(input.credentials.projectUrl, input.credentials.apiKey);
  try {
    const customCode = (await framer.getCustomCode()) as FramerCustomCode;
    const headEnd = customCode.headEnd;
    if (headEnd?.disabled) {
      throw new FramerGeoSnippetError(
        "Framer head-end custom code is disabled — enable it in Site Settings first",
        400,
      );
    }

    const merged = mergeGeoSnippetIntoHtml(headEnd?.html ?? null, input.workspaceId);
    await framer.setCustomCode({ location: "headEnd", html: merged });

    if (!input.publish) {
      return {
        published: false,
        detail: `Added CitePilot snippet to Framer custom code (${geoSnippetBlockHtml(input.workspaceId).split("\n").length} lines). Publish from Framer when ready.`,
      };
    }

    const preview = await framer.publish();
    await framer.deploy(preview.deployment.id);
    return {
      published: true,
      detail: "CitePilot GEO snippet applied and published to Framer.",
    };
  } finally {
    await framer.disconnect();
  }
}

export async function removeGeoSnippetFromFramer(
  credentials: FramerCredentials,
): Promise<void> {
  const framer = await connect(credentials.projectUrl, credentials.apiKey);
  try {
    const customCode = (await framer.getCustomCode()) as FramerCustomCode;
    const headEnd = customCode.headEnd;
    const cleaned = stripGeoSnippetFromHtml(headEnd?.html ?? null);
    await framer.setCustomCode({
      location: "headEnd",
      html: cleaned || null,
    });
  } finally {
    await framer.disconnect();
  }
}
