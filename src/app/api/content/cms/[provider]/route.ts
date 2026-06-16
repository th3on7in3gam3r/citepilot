import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { PILOT_UPGRADE_MESSAGE, userHasPilotAccess } from "@/lib/billing/access";
import { testFramerConnection } from "@/lib/cms/framer";
import { testGhostConnection } from "@/lib/cms/ghost";
import { deleteCmsConnection, getCmsConnection, upsertCmsConnection } from "@/lib/cms/store";
import { testShopifyConnection } from "@/lib/cms/shopify";
import { CMS_PROVIDERS, type CmsConnectionSummary, type CmsProvider } from "@/lib/cms/types";
import { testWebflowConnection } from "@/lib/cms/webflow";
import { maskSecret } from "@/lib/integrations/helpers";
import { testWordPressConnection } from "@/lib/cms/wordpress";
import { getWorkspaceById } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";
export const maxDuration = 60;

type Params = { params: Promise<{ provider: string }> };

function parseProvider(value: string): CmsProvider | null {
  return CMS_PROVIDERS.includes(value as CmsProvider) ? (value as CmsProvider) : null;
}

function getString(
  body: Record<string, unknown>,
  key: string,
  required = true,
): string | undefined {
  const value = body[key];
  if (typeof value === "string" && value.trim()) return value.trim();
  if (required) throw new Error(`${key} is required`);
  return undefined;
}

function toSummary(
  provider: CmsProvider,
  input: {
    displayName: string;
    siteUrl: string;
    detail?: string;
  },
): CmsConnectionSummary {
  return {
    provider,
    configured: true,
    connected: true,
    displayName: input.displayName,
    siteUrl: input.siteUrl,
    detail: input.detail,
  };
}

async function requireOwnedWorkspace(request: Request, workspaceId: string) {
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);
  const workspace = await getWorkspaceById(workspaceId, userId);
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }
  if (!(await userHasPilotAccess(userId))) {
    return NextResponse.json(
      { error: PILOT_UPGRADE_MESSAGE, upgradeUrl: "/pricing" },
      { status: 402 },
    );
  }
  return { userId, workspace };
}

export const GET = withApiLogging(async function GET(request: Request, { params }: Params) {
  const { provider: rawProvider } = await params;
  const provider = parseProvider(rawProvider);
  if (!provider) {
    return NextResponse.json({ error: "Unsupported provider" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId")?.trim();
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const auth = await requireOwnedWorkspace(request, workspaceId);
  if (auth instanceof NextResponse) return auth;

  const connection = await getCmsConnection(workspaceId, provider);
  if (!connection) {
    return NextResponse.json({
      provider,
      configured: false,
      connected: false,
    } satisfies CmsConnectionSummary);
  }

  return NextResponse.json({
    provider,
    configured: true,
    connected: connection.status === "connected",
    displayName: connection.displayName,
    siteUrl: connection.siteUrl,
  } satisfies CmsConnectionSummary);
});

export const POST = withApiLogging(async function POST(request: Request, { params }: Params) {
  try {
    const { provider: rawProvider } = await params;
    const provider = parseProvider(rawProvider);
    if (!provider) {
      return NextResponse.json({ error: "Unsupported provider" }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const workspaceId = getString(body, "workspaceId");
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    const auth = await requireOwnedWorkspace(request, workspaceId);
    if (auth instanceof NextResponse) return auth;

    if (provider === "webflow") {
      const credentials = {
        apiKey: getString(body, "apiKey")!,
        siteId: getString(body, "siteId")!,
        collectionId: getString(body, "collectionId")!,
      };
      const checked = await testWebflowConnection(credentials);
      await upsertCmsConnection({
        workspaceId,
        provider,
        displayName: checked.displayName,
        siteUrl: checked.siteUrl,
        credentials,
        remoteDefaults: {
          ...checked.remoteDefaults,
          maskedApiKey: maskSecret(credentials.apiKey),
        },
      });
      return NextResponse.json(toSummary(provider, checked));
    }

    if (provider === "wordpress") {
      const credentials = {
        siteUrl: getString(body, "siteUrl")!,
        username: getString(body, "username")!,
        appPassword: getString(body, "appPassword")!,
      };
      const checked = await testWordPressConnection(credentials);
      await upsertCmsConnection({
        workspaceId,
        provider,
        displayName: checked.displayName,
        siteUrl: checked.siteUrl,
        credentials,
        remoteDefaults: {
          maskedAppPassword: maskSecret(credentials.appPassword),
        },
      });
      return NextResponse.json(toSummary(provider, checked));
    }

    if (provider === "ghost") {
      const credentials = {
        siteUrl: getString(body, "siteUrl")!,
        adminApiKey: getString(body, "adminApiKey")!,
      };
      const checked = await testGhostConnection(credentials);
      await upsertCmsConnection({
        workspaceId,
        provider,
        displayName: checked.displayName,
        siteUrl: checked.siteUrl,
        credentials,
        remoteDefaults: {
          maskedAdminApiKey: maskSecret(credentials.adminApiKey),
        },
      });
      return NextResponse.json(toSummary(provider, checked));
    }

    if (provider === "shopify") {
      const credentials = {
        shopDomain: getString(body, "shopDomain")!,
        accessToken: getString(body, "accessToken")!,
      };
      const checked = await testShopifyConnection(credentials);
      await upsertCmsConnection({
        workspaceId,
        provider,
        displayName: checked.displayName,
        siteUrl: checked.siteUrl,
        credentials,
        remoteDefaults: {
          ...checked.remoteDefaults,
          maskedAccessToken: maskSecret(credentials.accessToken),
        },
      });
      return NextResponse.json(toSummary(provider, checked));
    }

    const credentials = {
      projectUrl: getString(body, "projectUrl")!,
      apiKey: getString(body, "apiKey")!,
      collectionId: getString(body, "collectionId")!,
      titleFieldId: getString(body, "titleFieldId")!,
      bodyFieldId: getString(body, "bodyFieldId")!,
      summaryFieldId: getString(body, "summaryFieldId", false),
    };
    const checked = await testFramerConnection(credentials);
    await upsertCmsConnection({
      workspaceId,
      provider,
      displayName: checked.displayName,
      siteUrl: checked.siteUrl,
      credentials,
      remoteDefaults: {
        ...checked.remoteDefaults,
        maskedApiKey: maskSecret(credentials.apiKey),
      },
    });
    return NextResponse.json(toSummary(provider, checked));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save connection";
    return NextResponse.json({ error: message }, { status: 400 });
  }
});

export const DELETE = withApiLogging(async function DELETE(request: Request, { params }: Params) {
  const { provider: rawProvider } = await params;
  const provider = parseProvider(rawProvider);
  if (!provider) {
    return NextResponse.json({ error: "Unsupported provider" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId")?.trim();
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const auth = await requireOwnedWorkspace(request, workspaceId);
  if (auth instanceof NextResponse) return auth;

  await deleteCmsConnection(workspaceId, provider);
  return NextResponse.json({ ok: true });
});
