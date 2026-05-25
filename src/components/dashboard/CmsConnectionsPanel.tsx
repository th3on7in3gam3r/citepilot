"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Panel } from "@/components/dashboard/DashboardUI";
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
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
    </label>
  );
}

export function CmsConnectionsPanel({
  workspaceId,
  onChanged,
}: {
  workspaceId: string;
  onChanged?: () => void;
}) {
  const [webflow, setWebflow] = useState<WebflowStatus | null>(null);
  const [providers, setProviders] = useState<CmsProviderStatus[]>([]);
  const [forms, setForms] = useState<ProviderForms>(emptyForms);
  const [saving, setSaving] = useState<CmsProvider | null>(null);
  const [removing, setRemoving] = useState<CmsProvider | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    void load();
  }, [load]);

  const providerMap = useMemo(
    () => new Map(providers.map((provider) => [provider.provider, provider])),
    [providers],
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
    setMessage(null);
    setError(null);

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
        setError(data.error ?? `Could not connect ${providerLabels[provider]}`);
        return;
      }

      setMessage(`${providerLabels[provider]} connected.`);
      await load();
      onChanged?.();
    } catch {
      setError(`Network error while connecting ${providerLabels[provider]}.`);
    } finally {
      setSaving(null);
    }
  }

  async function disconnectProvider(provider: CmsProvider) {
    setRemoving(provider);
    setMessage(null);
    setError(null);

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
        setError(data.error ?? `Could not disconnect ${providerLabels[provider]}`);
        return;
      }
      setMessage(`${providerLabels[provider]} disconnected.`);
      await load();
      onChanged?.();
    } catch {
      setError(`Network error while disconnecting ${providerLabels[provider]}.`);
    } finally {
      setRemoving(null);
    }
  }

  return (
    <Panel title="CMS connections" className="mt-6">
      <p className="text-sm text-muted">
        Push generated articles from CitePilot to your marketing site CMS. Webflow
        still uses your shared env config; the providers below save a workspace-level
        connection.
      </p>

      {message && (
        <p className="mt-4 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-ink">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
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
        >
          <div className="grid gap-3">
            <Field
              label="Site URL"
              value={forms.wordpress.siteUrl}
              onChange={(value) => updateForm("wordpress", "siteUrl", value)}
              placeholder="https://example.com"
            />
            <Field
              label="Username"
              value={forms.wordpress.username}
              onChange={(value) => updateForm("wordpress", "username", value)}
              placeholder="editor"
            />
            <Field
              label="Application Password"
              type="password"
              value={forms.wordpress.appPassword}
              onChange={(value) => updateForm("wordpress", "appPassword", value)}
              placeholder="xxxx xxxx xxxx xxxx"
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
        >
          <div className="grid gap-3">
            <Field
              label="Site URL"
              value={forms.ghost.siteUrl}
              onChange={(value) => updateForm("ghost", "siteUrl", value)}
              placeholder="https://blog.example.com"
            />
            <Field
              label="Admin API key"
              type="password"
              value={forms.ghost.adminApiKey}
              onChange={(value) => updateForm("ghost", "adminApiKey", value)}
              placeholder="id:secret"
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
        >
          <div className="grid gap-3">
            <Field
              label="Shop domain"
              value={forms.shopify.shopDomain}
              onChange={(value) => updateForm("shopify", "shopDomain", value)}
              placeholder="store-name.myshopify.com"
            />
            <Field
              label="Admin access token"
              type="password"
              value={forms.shopify.accessToken}
              onChange={(value) => updateForm("shopify", "accessToken", value)}
              placeholder="shpat_..."
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
            />
            <Field
              label="API key"
              type="password"
              value={forms.framer.apiKey}
              onChange={(value) => updateForm("framer", "apiKey", value)}
              placeholder="framer_..."
            />
            <Field
              label="Collection ID"
              value={forms.framer.collectionId}
              onChange={(value) => updateForm("framer", "collectionId", value)}
              placeholder="collection id"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <Field
                label="Title field ID"
                value={forms.framer.titleFieldId}
                onChange={(value) => updateForm("framer", "titleFieldId", value)}
                placeholder="title field"
              />
              <Field
                label="Body field ID"
                value={forms.framer.bodyFieldId}
                onChange={(value) => updateForm("framer", "bodyFieldId", value)}
                placeholder="body field"
              />
            </div>
            <Field
              label="Summary field ID (optional)"
              value={forms.framer.summaryFieldId}
              onChange={(value) => updateForm("framer", "summaryFieldId", value)}
              placeholder="summary field"
            />
          </div>
        </ProviderCard>
      </div>
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
