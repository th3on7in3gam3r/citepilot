import { getCmsConnection } from "@/lib/cms/store";
import { webflowCredentialsToConfig } from "@/lib/cms/webflow";
import { getWebflowConfig, type WebflowConfig } from "@/lib/webflow/config";

export async function resolveWebflowConfig(
  workspaceId?: string | null,
): Promise<WebflowConfig | null> {
  if (workspaceId) {
    const connection = await getCmsConnection(workspaceId, "webflow");
    if (connection?.status === "connected") {
      return webflowCredentialsToConfig(
        connection.credentials,
        connection.remoteDefaults,
      );
    }
  }
  return getWebflowConfig();
}
