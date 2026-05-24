export type WebflowConfig = {
  apiKey: string;
  siteId: string;
  collectionId: string;
  fieldName: string;
  fieldSlug: string;
  fieldBody: string;
  autoPublishSite: boolean;
  blogPathPrefix: string;
  sitePreviewUrl?: string;
};

export function getWebflowConfig(): WebflowConfig | null {
  const apiKey = process.env.WEBFLOW_API_KEY?.trim();
  const siteId = process.env.WEBFLOW_SITE_ID?.trim();
  const collectionId = process.env.WEBFLOW_COLLECTION_ID?.trim();
  if (!apiKey || !siteId || !collectionId) return null;

  return {
    apiKey,
    siteId,
    collectionId,
    fieldName: process.env.WEBFLOW_FIELD_NAME?.trim() || "name",
    fieldSlug: process.env.WEBFLOW_FIELD_SLUG?.trim() || "slug",
    fieldBody: process.env.WEBFLOW_FIELD_BODY?.trim() || "body-post",
    autoPublishSite: process.env.WEBFLOW_AUTO_PUBLISH_SITE !== "false",
    blogPathPrefix: process.env.WEBFLOW_BLOG_PATH?.trim() || "/blog",
    sitePreviewUrl: process.env.WEBFLOW_PREVIEW_URL?.trim() || undefined,
  };
}

export function isWebflowConfigured(): boolean {
  return getWebflowConfig() !== null;
}

export function webflowEnvStatus(): { ok: boolean; detail: string } {
  const missing: string[] = [];
  if (!process.env.WEBFLOW_API_KEY?.trim()) missing.push("WEBFLOW_API_KEY");
  if (!process.env.WEBFLOW_SITE_ID?.trim()) missing.push("WEBFLOW_SITE_ID");
  if (!process.env.WEBFLOW_COLLECTION_ID?.trim()) {
    missing.push("WEBFLOW_COLLECTION_ID");
  }
  if (missing.length) {
    return { ok: false, detail: `Missing ${missing.join(", ")}` };
  }
  return { ok: true, detail: "API key, site, and collection configured" };
}
