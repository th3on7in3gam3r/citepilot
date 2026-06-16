"use client";

import { useCallback, useEffect, useState } from "react";
import { FeatureGate } from "@/components/billing/FeatureGate";
import { DashboardPageHeader } from "@/components/dashboard/DashboardUI";
import { SlackAlertsPanel } from "@/components/dashboard/SlackAlertsPanel";
import { effectInit } from "@/lib/react/effect-init";
import { useBilling } from "@/contexts/BillingContext";
import { useToast } from "@/components/notifications/ToastProvider";
import { site } from "@/lib/site";
import type { CmsProvider } from "@/lib/cms/types";
import type { IntegrationStatus } from "@/lib/integrations/status";
import { framerWidgetScriptTag } from "@/lib/integrations/helpers";

const providerOrder: CmsProvider[] = [
  "webflow",
  "wordpress",
  "ghost",
  "shopify",
  "framer",
];

const logoColors: Record<CmsProvider, string> = {
  webflow: "#146EF5",
  wordpress: "#21759B",
  ghost: "#15171A",
  shopify: "#96BF48",
  framer: "#0055FF",
};

function statusBadge(status: IntegrationStatus["status"], connected: boolean) {
  if (status === "error") {
    return { label: "Error — reconnect", className: "bg-rose-50 text-rose-800 border-rose-200" };
  }
  if (connected) {
    return { label: "Connected ✓", className: "bg-emerald-50 text-emerald-800 border-emerald-200" };
  }
  return { label: "Not connected", className: "bg-surface text-muted border-border" };
}

function relativeTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const days = Math.round((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function IntegrationsPanel({ workspaceId }: { workspaceId: string }) {
  const toast = useToast();
  const { isPaid, ready: billingReady } = useBilling();
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<CmsProvider | null>(null);
  const [manageId, setManageId] = useState<CmsProvider | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [webflowForm, setWebflowForm] = useState({
    apiKey: "",
    siteId: "",
    collectionId: "",
  });
  const [webflowSites, setWebflowSites] = useState<Array<{ id: string; name: string }>>([]);
  const [webflowCollections, setWebflowCollections] = useState<Array<{ id: string; name: string }>>([]);

  const [wordpressForm, setWordpressForm] = useState({
    siteUrl: "",
    username: "",
    appPassword: "",
  });
  const [ghostForm, setGhostForm] = useState({ siteUrl: "", adminApiKey: "" });
  const [shopifyForm, setShopifyForm] = useState({ shopDomain: "", accessToken: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/integrations/status?workspaceId=${encodeURIComponent(workspaceId)}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("load failed");
      const data = (await res.json()) as { integrations: IntegrationStatus[] };
      setIntegrations(data.integrations ?? []);
    } catch {
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    effectInit(() => {
      void load();
    });
  }, [load]);

  async function fetchWebflowSites() {
    if (!webflowForm.apiKey.trim()) return;
    const res = await fetch("/api/content/webflow/sites", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: webflowForm.apiKey }),
    });
    const data = (await res.json()) as { sites?: Array<{ id: string; name: string }>; error?: string };
    if (!res.ok) {
      toast.error(data.error ?? "Could not load Webflow sites");
      return;
    }
    setWebflowSites(data.sites ?? []);
    if (data.sites?.length === 1) {
      setWebflowForm((f) => ({ ...f, siteId: data.sites![0]!.id }));
    }
  }

  async function fetchWebflowCollections(siteId: string) {
    if (!webflowForm.apiKey.trim() || !siteId) return;
    const res = await fetch("/api/content/webflow/collections", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: webflowForm.apiKey, siteId }),
    });
    const data = (await res.json()) as {
      collections?: Array<{ id: string; name: string }>;
      error?: string;
    };
    if (!res.ok) {
      toast.error(data.error ?? "Could not load collections");
      return;
    }
    setWebflowCollections(data.collections ?? []);
  }

  async function connectProvider(provider: CmsProvider) {
    setSaving(true);
    try {
      let body: Record<string, string> = { workspaceId };
      if (provider === "webflow") {
        body = { ...body, ...webflowForm };
      } else if (provider === "wordpress") {
        body = { ...body, ...wordpressForm };
      } else if (provider === "ghost") {
        body = { ...body, ...ghostForm };
      } else if (provider === "shopify") {
        body = { ...body, ...shopifyForm };
      }

      const res = await fetch(`/api/content/cms/${provider}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string; displayName?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Connection failed");
        return;
      }
      toast.success(`Connected to ${data.displayName ?? provider}`);
      setActiveId(null);
      setManageId(null);
      await load();
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function testProvider(provider: CmsProvider) {
    setTesting(true);
    await connectProvider(provider);
    setTesting(false);
  }

  async function disconnectProvider(provider: CmsProvider) {
    const label = integrations.find((i) => i.id === provider)?.name ?? provider;
    if (
      !window.confirm(
        `This will stop article publishing to ${label}. Disconnect?`,
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        `/api/content/cms/${provider}?workspaceId=${encodeURIComponent(workspaceId)}`,
        { method: "DELETE", credentials: "include" },
      );
      if (!res.ok) {
        toast.error("Could not disconnect");
        return;
      }
      toast.success(`${label} disconnected`);
      setManageId(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function markFramerInstalled() {
    setSaving(true);
    try {
      const res = await fetch("/api/integrations/framer-snippet", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      if (!res.ok) {
        toast.error("Could not save");
        return;
      }
      toast.success("Framer snippet marked as installed");
      setActiveId(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (!billingReady) {
    return <div className="h-48 animate-pulse rounded-2xl bg-surface" />;
  }

  const framerScript = framerWidgetScriptTag(workspaceId, site.url);
  const ordered = providerOrder
    .map((id) => integrations.find((item) => item.id === id))
    .filter(Boolean) as IntegrationStatus[];

  const cmsSection = !isPaid ? (
    <FeatureGate
      feature="cms_publish"
      title="CMS integrations"
      description="Connect Webflow, WordPress, Ghost, Shopify, or Framer and publish generated articles in one click."
      highlights={[
        "Workspace-level credentials",
        "Test connections before publishing",
        "Publish from the article queue",
      ]}
    />
  ) : loading ? (
    <p className="text-sm text-muted">Loading integrations…</p>
  ) : (
    <div className="grid gap-4 md:grid-cols-2">
      {ordered.map((item) => {
        const badge = statusBadge(item.status, item.connected);
        return (
          <article
            key={item.id}
            className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold text-white"
                  style={{ background: logoColors[item.id] }}
                >
                  {item.name.charAt(0)}
                </span>
                <div>
                  <h3 className="font-display font-bold text-ink">{item.name}</h3>
                  <span
                    className={`mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-3 flex-1 text-sm text-muted">{item.description}</p>
            {item.connected && item.displayName && (
              <p className="mt-2 text-xs text-muted">
                {item.displayName}
                {item.siteUrl ? ` · ${item.siteUrl}` : ""}
              </p>
            )}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => {
                  if (item.connected) setManageId(item.id);
                  else setActiveId(item.id);
                }}
                className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white hover:bg-ink/90"
              >
                {item.connected ? "Manage" : "Connect"}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );

  return (
    <>
      <DashboardPageHeader
        headingLevel="h2"
        title="Integrations"
        description="Connect CMS platforms to publish articles, and Slack for citation digests and alerts."
      />

      <section className="mb-10">
        <h3 className="font-display text-base font-bold text-ink">Publishing (CMS)</h3>
        <p className="mt-1 text-sm text-muted">
          Webflow, WordPress, Ghost, Shopify, and Framer — publish from your article queue.
        </p>
        <div className="mt-4">{cmsSection}</div>
      </section>

      <section>
        <h3 className="font-display text-base font-bold text-ink">Slack alerts</h3>
        <p className="mt-1 text-sm text-muted">
          Authorize with Slack OAuth — no email field. After connecting, choose a channel for
          digests and citation change alerts.
        </p>
        <article className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4A154B] text-sm font-bold text-white">
              S
            </span>
            <div>
              <h3 className="font-display font-bold text-ink">Slack</h3>
              <p className="text-xs text-muted">Weekly digests & citation alerts</p>
            </div>
          </div>
          <SlackAlertsPanel workspaceId={workspaceId} embedded />
        </article>
      </section>

      {activeId === "webflow" && (
        <ConnectModal title="Connect Webflow" onClose={() => setActiveId(null)}>
          <Field label="Webflow API key">
            <input
              type="password"
              value={webflowForm.apiKey}
              onChange={(e) => setWebflowForm((f) => ({ ...f, apiKey: e.target.value }))}
              onBlur={() => void fetchWebflowSites()}
              className={inputClass}
              placeholder="wf_..."
            />
            <a
              href="https://webflow.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs font-semibold text-accent hover:underline"
            >
              Get your API key →
            </a>
          </Field>
          <Field label="Site">
            <select
              value={webflowForm.siteId}
              onChange={(e) => {
                const siteId = e.target.value;
                setWebflowForm((f) => ({ ...f, siteId, collectionId: "" }));
                void fetchWebflowCollections(siteId);
              }}
              className={inputClass}
            >
              <option value="">Select site…</option>
              {webflowSites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Blog collection">
            <select
              value={webflowForm.collectionId}
              onChange={(e) =>
                setWebflowForm((f) => ({ ...f, collectionId: e.target.value }))
              }
              className={inputClass}
            >
              <option value="">Select collection…</option>
              {webflowCollections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <ModalActions
            saving={saving || testing}
            onTest={() => void testProvider("webflow")}
            onSave={() => void connectProvider("webflow")}
            testLabel="Test connection"
          />
        </ConnectModal>
      )}

      {activeId === "wordpress" && (
        <ConnectModal title="Connect WordPress" onClose={() => setActiveId(null)}>
          <Field label="WordPress site URL">
            <input
              value={wordpressForm.siteUrl}
              onChange={(e) =>
                setWordpressForm((f) => ({ ...f, siteUrl: e.target.value }))
              }
              className={inputClass}
              placeholder="https://myblog.com"
            />
          </Field>
          <Field label="Username">
            <input
              value={wordpressForm.username}
              onChange={(e) =>
                setWordpressForm((f) => ({ ...f, username: e.target.value }))
              }
              className={inputClass}
            />
          </Field>
          <Field label="Application password">
            <input
              type="password"
              value={wordpressForm.appPassword}
              onChange={(e) =>
                setWordpressForm((f) => ({ ...f, appPassword: e.target.value }))
              }
              className={inputClass}
            />
            <p className="mt-1 text-xs text-muted">
              WP Admin → Users → Profile → Application Passwords → Add New
            </p>
          </Field>
          <ModalActions
            saving={saving || testing}
            onTest={() => void testProvider("wordpress")}
            onSave={() => void connectProvider("wordpress")}
          />
        </ConnectModal>
      )}

      {activeId === "ghost" && (
        <ConnectModal title="Connect Ghost" onClose={() => setActiveId(null)}>
          <Field label="Ghost site URL">
            <input
              value={ghostForm.siteUrl}
              onChange={(e) => setGhostForm((f) => ({ ...f, siteUrl: e.target.value }))}
              className={inputClass}
              placeholder="https://blog.example.com"
            />
          </Field>
          <Field label="Admin API key">
            <input
              type="password"
              value={ghostForm.adminApiKey}
              onChange={(e) =>
                setGhostForm((f) => ({ ...f, adminApiKey: e.target.value }))
              }
              className={inputClass}
            />
            <p className="mt-1 text-xs text-muted">
              Ghost Admin → Integrations → Add custom integration
            </p>
          </Field>
          <ModalActions
            saving={saving || testing}
            onTest={() => void testProvider("ghost")}
            onSave={() => void connectProvider("ghost")}
          />
        </ConnectModal>
      )}

      {activeId === "shopify" && (
        <ConnectModal title="Connect Shopify" onClose={() => setActiveId(null)}>
          <Field label="Shopify store URL">
            <input
              value={shopifyForm.shopDomain}
              onChange={(e) =>
                setShopifyForm((f) => ({ ...f, shopDomain: e.target.value }))
              }
              className={inputClass}
              placeholder="mystore.myshopify.com"
            />
          </Field>
          <Field label="Admin API access token">
            <input
              type="password"
              value={shopifyForm.accessToken}
              onChange={(e) =>
                setShopifyForm((f) => ({ ...f, accessToken: e.target.value }))
              }
              className={inputClass}
            />
          </Field>
          <ModalActions
            saving={saving || testing}
            onTest={() => void testProvider("shopify")}
            onSave={() => void connectProvider("shopify")}
          />
        </ConnectModal>
      )}

      {activeId === "framer" && (
        <ConnectModal title="Framer GEO snippet" onClose={() => setActiveId(null)}>
          <p className="text-sm text-muted">
            Framer publishing uses our GEO snippet script tag. Paste it in Framer:
            Site Settings → Custom Code → Head.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface p-3 text-xs text-ink">
            {framerScript}
          </pre>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(framerScript);
              toast.success("Script copied");
            }}
            className="mt-2 text-xs font-semibold text-accent hover:underline"
          >
            Copy script
          </button>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void markFramerInstalled()}
              className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              Mark as installed
            </button>
          </div>
        </ConnectModal>
      )}

      {manageId && (
        <ConnectModal
          title={`Manage ${integrations.find((i) => i.id === manageId)?.name ?? ""}`}
          onClose={() => setManageId(null)}
        >
          {(() => {
            const item = integrations.find((i) => i.id === manageId);
            if (!item) return null;
            return (
              <>
                <p className="text-sm text-muted">
                  {item.displayName}
                  {item.siteUrl ? ` · ${item.siteUrl}` : ""}
                </p>
                {item.maskedSecret && (
                  <p className="mt-2 text-xs text-muted">API key: {item.maskedSecret}</p>
                )}
                {item.lastPublishTitle && (
                  <p className="mt-3 text-sm text-ink">
                    Last successful publish:{" "}
                    <span className="font-semibold">{item.lastPublishTitle}</span> —{" "}
                    {relativeTime(item.lastPublishAt)}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {manageId !== "framer" && (
                    <button
                      type="button"
                      disabled={saving || testing}
                      onClick={() => void testProvider(manageId)}
                      className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink"
                    >
                      {testing ? "Testing…" : "Test connection"}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void disconnectProvider(manageId)}
                    className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700"
                  >
                    Disconnect
                  </button>
                </div>
              </>
            );
          })()}
        </ConnectModal>
      )}
    </>
  );
}

const inputClass =
  "mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-accent";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

function ConnectModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-ink"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="mt-4 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function ModalActions({
  saving,
  onTest,
  onSave,
  testLabel = "Test connection",
}: {
  saving: boolean;
  onTest: () => void;
  onSave: () => void;
  testLabel?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      <button
        type="button"
        disabled={saving}
        onClick={onTest}
        className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink disabled:opacity-50"
      >
        {saving ? "Working…" : testLabel}
      </button>
      <button
        type="button"
        disabled={saving}
        onClick={onSave}
        className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
      >
        Save connection
      </button>
    </div>
  );
}
