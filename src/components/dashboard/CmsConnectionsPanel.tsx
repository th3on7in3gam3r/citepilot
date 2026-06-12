"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { effectInit } from "@/lib/react/effect-init";
import { Panel } from "@/components/dashboard/DashboardUI";
import { useToast } from "@/components/notifications/ToastProvider";
import { cmsPlatforms } from "@/lib/features";
import type { CmsProvider } from "@/lib/cms/types";

type WebflowStatus = {
  configured: boolean;
  connected: boolean;
  siteName?: string;
  collectionName?: string;
  detail?: string;
};

type CmsProviderStatus = {
  provider: CmsProvider;
  configured: boolean;
  connected: boolean;
  displayName?: string;
  siteUrl?: string;
  detail?: string;
};

type ProviderForms = {
  wordpress: {
    siteUrl: string;
    username: string;
    appPassword: string;
  };
  ghost: {
    siteUrl: string;
    adminApiKey: string;
  };
  shopify: {
    shopDomain: string;
    accessToken: string;
  };
  framer: {
    projectUrl: string;
    apiKey: string;
    collectionId: string;
    titleFieldId: string;
    bodyFieldId: string;
    summaryFieldId: string;
  };
};

const providerLabels: Record<CmsProvider, string> = {
  wordpress: "WordPress",
  ghost: "Ghost",
  shopify: "Shopify",
  framer: "Framer",
};

function emptyForms(): ProviderForms {
  return {
    wordpress: {
      siteUrl: "",
      username: "",
      appPassword: "",
    },
    ghost: {
      siteUrl: "",
      adminApiKey: "",
    },
    shopify: {
      shopDomain: "",
      accessToken: "",
    },
    framer: {
      projectUrl: "",
      apiKey: "",
      collectionId: "",
      titleFieldId: "",
      bodyFieldId: "",
      summaryFieldId: "",
    },
  };
}

function StatusPill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "connected" | "pending" | "idle";
}) {
  const styles = {
    connected: "border-emerald-200 bg-emerald-50 text-emerald-800",
    pending: "border-amber-200 bg-amber-50 text-amber-800",
    idle: "border-border bg-surface text-muted",
  };

  return (
    <span className={`rounded-full border px-4 py-2 text-sm font-medium ${styles[tone]}`}>
      {children}
    </span>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  help,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  help?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-ink">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent"
      />
      {help && <span className="mt-1.5 block text-xs leading-relaxed text-muted">{help}</span>}
    </label>
  );
}

export function CmsConnectionsPanel({
  workspaceId,
  onChanged,
  embedded = false,
}: {
  workspaceId: string;
  onChanged?: () => void;
  embedded?: boolean;
}) {
  const toast = useToast();
  const [webflow, setWebflow] = useState<WebflowStatus | null>(null);
  const [providers, setProviders] = useState<CmsProviderStatus[]>([]);
  const [forms, setForms] = useState<ProviderForms>(emptyForms);
  const [saving, setSaving] = useState<CmsProvider | null>(null);
  const [removing, setRemoving] = useState<CmsProvider | null>(null);
  const load = useCallback(async () => {
    const [webflowRes, cmsRes] = await Promise.all([
      fetch("/api/content/webflow/status", { credentials: "include" }),
      fetch(`/api/content/cms?workspaceId=${encodeURIComponent(workspaceId)}`, {
        credentials: "include",
      }),
    ]);

    if (webflowRes.ok) {
      setWebflow((await webflowRes.json()) as WebflowStatus);
    } else {
      setWebflow(null);
    }

    if (cmsRes.ok) {
      const data = (await cmsRes.json()) as { providers?: CmsProviderStatus[] };
      setProviders(data.providers ?? []);
    } else {
      setProviders([]);
    }
  }, [workspaceId]);

  useEffect(() => {
    effectInit(() => {
      void load();
    });
  }, [load]);

  const providerMap = useMemo(
    () => new Map(providers.map((provider) => [provider.provider, provider])),
    [providers],
  );
  const hasConnectedProvider = Boolean(
    (webflow?.configured && webflow.connected) || providers.some((provider) => provider.connected),
  );

  function updateForm<P extends CmsProvider>(
    provider: P,
    key: keyof ProviderForms[P],
    value: string,
  ) {
    setForms((current) => ({
      ...current,
      [provider]: {
        ...current[provider],
        [key]: value,
      },
    }));
  }

  async function saveProvider(provider: CmsProvider) {
    setSaving(provider);

    try {
      const res = await fetch(`/api/content/cms/${provider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          workspaceId,
          ...forms[provider],
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? `Could not connect ${providerLabels[provider]}`);
        return;
      }

      toast.success(`${providerLabels[provider]} connected.`);
      await load();
      onChanged?.();
    } catch {
      toast.error(`Network error while connecting ${providerLabels[provider]}.`);
    } finally {
      setSaving(null);
    }
  }

  async function disconnectProvider(provider: CmsProvider) {
    setRemoving(provider);

    try {
      const res = await fetch(
        `/api/content/cms/${provider}?workspaceId=${encodeURIComponent(workspaceId)}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? `Could not disconnect ${providerLabels[provider]}`);
        return;
      }
      toast.success(`${providerLabels[provider]} disconnected.`);
      await load();
      onChanged?.();
    } catch {
      toast.error(`Network error while disconnecting ${providerLabels[provider]}.`);
    } finally {
      setRemoving(null);
    }
  }

  const body = (
    <>
      <p className="text-sm text-muted">
        Push generated articles from CitePilot to your marketing site CMS. Webflow
        still uses your shared env config; the providers below save a workspace-level
        connection.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_0.95fr]">
        <div className="rounded-2xl border border-border bg-surface/60 p-5">
          <h3 className="font-display text-lg font-bold text-ink">New here?</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Connect a CMS only if this workspace already has a real site on
            WordPress, Ghost, Shopify, Framer, or Webflow. If you do not have one of
            those yet, skip this section for now and keep generating drafts inside
            CitePilot.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href="/help/cms-publishing"
              className="rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:bg-surface"
            >
              Read CMS publishing guide
            </Link>
            <span className="text-xs text-muted">
              Credentials are saved per workspace and can be disconnected at any time.
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface/60 p-5">
          <h3 className="font-display text-lg font-bold text-ink">What you need</h3>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
            <li>
              <span className="font-semibold text-ink">WordPress:</span> site URL,
              username, Application Password
            </li>
            <li>
              <span className="font-semibold text-ink">Ghost:</span> site URL, Admin
              API key
            </li>
            <li>
              <span className="font-semibold text-ink">Shopify:</span> shop domain,
              Admin access token
            </li>
            <li>
              <span className="font-semibold text-ink">Framer:</span> project URL, API
              key, collection ID, field IDs
            </li>
          </ul>
        </div>
      </div>

      {!hasConnectedProvider && (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-white px-4 py-4 text-sm text-muted">
          No CMS connected yet. That is fine if you are still drafting content or do
          not have a client site to publish into yet.
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {cmsPlatforms.map((platform) => {
          if (platform.id === "webflow") {
            const connected = Boolean(webflow?.configured && webflow.connected);
            const pending = Boolean(webflow?.configured && !webflow.connected);
            return (
              <StatusPill key={platform.id} tone={connected ? "connected" : pending ? "pending" : "idle"}>
                {platform.name}
                {connected
                  ? " · connected"
                  : pending
                    ? " · fix token scopes"
                    : " · env setup"}
              </StatusPill>
            );
          }

          const status = providerMap.get(platform.id as CmsProvider);
          return (
            <StatusPill
              key={platform.id}
              tone={status?.connected ? "connected" : status?.configured ? "pending" : "idle"}
            >
              {platform.name}
              {status?.connected
                ? " · connected"
                : status?.configured
                  ? " · reconnect"
                  : " · not connected"}
            </StatusPill>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface/60 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display font-bold text-ink">Webflow</h3>
              <p className="mt-1 text-sm text-muted">
                Existing env-based publishing for the site-wide blog collection.
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                webflow?.configured && webflow.connected
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-surface text-muted"
              }`}
            >
              {webflow?.configured && webflow.connected ? "Connected" : "Env setup"}
            </span>
          </div>
          {webflow?.detail && (
            <p className="mt-3 text-sm text-muted">
              {webflow.siteName ? `${webflow.siteName} · ` : ""}
              {webflow.collectionName ? `${webflow.collectionName} · ` : ""}
              {webflow.detail}
            </p>
          )}
        </div>

        <ProviderCard
          title="WordPress"
          status={providerMap.get("wordpress")}
          saving={saving === "wordpress"}
          removing={removing === "wordpress"}
          onSave={() => void saveProvider("wordpress")}
          onRemove={() => void disconnectProvider("wordpress")}
          note="Use this only if the workspace already has a WordPress site."
        >
          <div className="grid gap-3">
            <Field
              label="Site URL"
              value={forms.wordpress.siteUrl}
              onChange={(value) => updateForm("wordpress", "siteUrl", value)}
              placeholder="https://example.com"
              help="Use the full root URL for the site where posts should publish."
            />
            <Field
              label="Username"
              value={forms.wordpress.username}
              onChange={(value) => updateForm("wordpress", "username", value)}
              placeholder="editor"
              help="This should be the WordPress user tied to the Application Password."
            />
            <Field
              label="Application Password"
              type="password"
              value={forms.wordpress.appPassword}
              onChange={(value) => updateForm("wordpress", "appPassword", value)}
              placeholder="xxxx xxxx xxxx xxxx"
              help="Create this in WordPress under Users → Profile → Application Passwords."
            />
          </div>
        </ProviderCard>

        <ProviderCard
          title="Ghost"
          status={providerMap.get("ghost")}
          saving={saving === "ghost"}
          removing={removing === "ghost"}
          onSave={() => void saveProvider("ghost")}
          onRemove={() => void disconnectProvider("ghost")}
          note="Use this when the workspace blog is already hosted in Ghost."
        >
          <div className="grid gap-3">
            <Field
              label="Site URL"
              value={forms.ghost.siteUrl}
              onChange={(value) => updateForm("ghost", "siteUrl", value)}
              placeholder="https://blog.example.com"
              help="Point this to the Ghost site that should receive the published post."
            />
            <Field
              label="Admin API key"
              type="password"
              value={forms.ghost.adminApiKey}
              onChange={(value) => updateForm("ghost", "adminApiKey", value)}
              placeholder="id:secret"
              help="Copy the Admin API key from Ghost Integrations exactly as shown."
            />
          </div>
        </ProviderCard>

        <ProviderCard
          title="Shopify"
          status={providerMap.get("shopify")}
          saving={saving === "shopify"}
          removing={removing === "shopify"}
          onSave={() => void saveProvider("shopify")}
          onRemove={() => void disconnectProvider("shopify")}
          note="Best for stores that already use Shopify's built-in blog."
        >
          <div className="grid gap-3">
            <Field
              label="Shop domain"
              value={forms.shopify.shopDomain}
              onChange={(value) => updateForm("shopify", "shopDomain", value)}
              placeholder="store-name.myshopify.com"
              help="Use the .myshopify.com admin domain for the store."
            />
            <Field
              label="Admin access token"
              type="password"
              value={forms.shopify.accessToken}
              onChange={(value) => updateForm("shopify", "accessToken", value)}
              placeholder="shpat_..."
              help="The token needs permission to create and update blog articles."
            />
          </div>
        </ProviderCard>

        <ProviderCard
          title="Framer"
          status={providerMap.get("framer")}
          saving={saving === "framer"}
          removing={removing === "framer"}
          onSave={() => void saveProvider("framer")}
          onRemove={() => void disconnectProvider("framer")}
          note="Framer needs the target collection ID plus the field IDs that should receive title, body, and optional summary."
        >
          <div className="grid gap-3">
            <Field
              label="Project URL"
              value={forms.framer.projectUrl}
              onChange={(value) => updateForm("framer", "projectUrl", value)}
              placeholder="https://framer.com/projects/..."
              help="Use the Framer project that owns the CMS collection."
            />
            <Field
              label="API key"
              type="password"
              value={forms.framer.apiKey}
              onChange={(value) => updateForm("framer", "apiKey", value)}
              placeholder="framer_..."
              help="Generate this from the project's Site Settings in Framer."
            />
            <Field
              label="Collection ID"
              value={forms.framer.collectionId}
              onChange={(value) => updateForm("framer", "collectionId", value)}
              placeholder="Blog Posts"
              help="Collection name or internal ID — e.g. Blog Posts"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <Field
                label="Title field"
                value={forms.framer.titleFieldId}
                onChange={(value) => updateForm("framer", "titleFieldId", value)}
                placeholder="title"
                help="Field name or ID for the article title."
              />
              <Field
                label="Body field"
                value={forms.framer.bodyFieldId}
                onChange={(value) => updateForm("framer", "bodyFieldId", value)}
                placeholder="body"
                help="Field name or ID for article content (formatted text preferred)."
              />
            </div>
            <Field
              label="Summary field (optional)"
              value={forms.framer.summaryFieldId}
              onChange={(value) => updateForm("framer", "summaryFieldId", value)}
              placeholder="summary"
              help="Optional field name or ID for excerpt/summary."
            />
          </div>
        </ProviderCard>
      </div>
    </>
  );

  if (embedded) return body;

  return (
    <Panel title="CMS connections" className="mt-6">
      {body}
    </Panel>
  );
}

function ProviderCard({
  title,
  status,
  saving,
  removing,
  onSave,
  onRemove,
  note,
  children,
}: {
  title: string;
  status?: CmsProviderStatus;
  saving: boolean;
  removing: boolean;
  onSave: () => void;
  onRemove: () => void;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display font-bold text-ink">{title}</h3>
          <p className="mt-1 text-sm text-muted">
            {status?.connected
              ? `${status.displayName ?? title} is ready to publish.`
              : "Save the connection to enable publish buttons in the article queue."}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            status?.connected ? "bg-emerald-50 text-emerald-800" : "bg-surface text-muted"
          }`}
        >
          {status?.connected ? "Connected" : "Not connected"}
        </span>
      </div>

      {(status?.detail || status?.siteUrl || note) && (
        <div className="mt-3 space-y-1 text-sm text-muted">
          {status?.detail && <p>{status.detail}</p>}
          {status?.siteUrl && (
            <a
              href={status.siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex text-accent hover:underline"
            >
              {status.siteUrl}
            </a>
          )}
          {note && <p>{note}</p>}
        </div>
      )}

      <div className="mt-4">{children}</div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saving || removing}
          className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : status?.connected ? "Reconnect" : "Save connection"}
        </button>
        {status?.configured && (
          <button
            type="button"
            onClick={onRemove}
            disabled={saving || removing}
            className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
          >
            {removing ? "Removing…" : "Disconnect"}
          </button>
        )}
      </div>
    </div>
  );
}
