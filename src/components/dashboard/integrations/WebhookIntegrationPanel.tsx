"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FeatureGate } from "@/components/billing/FeatureGate";
import { useBilling } from "@/contexts/BillingContext";
import { useToast } from "@/components/notifications/ToastProvider";
import {
  PLATFORM_LABELS,
  WEBHOOK_QUICK_CONNECT_TEMPLATES,
  type AutomationPlatform,
} from "@/lib/integrations/zapier-templates";

type WebhookRow = {
  id: string;
  url: string;
  createdAt: string;
};

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-normal text-ink";

export function WebhookIntegrationPanel({ workspaceId }: { workspaceId: string }) {
  const { isFleet, ready } = useBilling();
  const toast = useToast();
  const [platform, setPlatform] = useState<AutomationPlatform>("zapier");
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>("slack");
  const [loading, setLoading] = useState(true);
  const [endpoints, setEndpoints] = useState<WebhookRow[]>([]);
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/integrations/webhooks?workspaceId=${encodeURIComponent(workspaceId)}`,
        { credentials: "include" },
      );
      const data = (await res.json()) as {
        endpoints?: WebhookRow[];
        error?: string;
      };
      if (!res.ok) {
        toast.error(data.error ?? "Failed to load webhooks");
        return;
      }
      setEndpoints(data.endpoints ?? []);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, toast]);

  useEffect(() => {
    if (ready && isFleet) void load();
  }, [ready, isFleet, load]);

  async function addEndpoint(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || !secret.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/integrations/webhooks", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, url: url.trim(), secret: secret.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Failed to add webhook");
        return;
      }
      setUrl("");
      setSecret("");
      toast.success("Webhook connected — send a test event to finish setup in Zapier/Make");
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function testEndpoint(input: { endpointId?: string; testUrl?: string; testSecret?: string }) {
    const key = input.endpointId ?? "draft";
    setTestingId(key);
    try {
      const res = await fetch("/api/integrations/webhooks/test", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          endpointId: input.endpointId,
          url: input.testUrl,
          secret: input.testSecret,
        }),
      });
      const data = (await res.json()) as { error?: string; status?: number };
      if (!res.ok) {
        toast.error(data.error ?? "Test delivery failed");
        return;
      }
      toast.success("Test event sent", {
        description: data.status
          ? `HTTP ${data.status} — check ${PLATFORM_LABELS[platform]} for captured fields`
          : undefined,
      });
    } finally {
      setTestingId(null);
    }
  }

  async function removeEndpoint(id: string) {
    const res = await fetch(
      `/api/integrations/webhooks?workspaceId=${encodeURIComponent(workspaceId)}&id=${encodeURIComponent(id)}`,
      { method: "DELETE", credentials: "include" },
    );
    if (!res.ok) {
      toast.error("Failed to remove webhook");
      return;
    }
    toast.success("Webhook removed");
    await load();
  }

  function copyHookUrl() {
    if (!url.trim()) {
      toast.error("Paste your Catch Hook URL first");
      return;
    }
    void navigator.clipboard.writeText(url.trim());
    toast.success("Webhook URL copied");
  }

  if (!ready) {
    return <div className="mt-4 h-24 animate-pulse rounded-xl bg-surface" />;
  }

  if (!isFleet) {
    return (
      <FeatureGate
        feature="webhook_alerts"
        title="Zapier & Make webhooks"
        description="Fleet plan — pipe citation events into Slack, Notion, Google Sheets, HubSpot, and 5,000+ apps via Zapier or Make.com."
        cta="Upgrade to Fleet →"
        highlights={[
          "Flat JSON payloads for no-code tools",
          "Step-by-step quick connect templates",
          "HMAC-signed POST delivery",
        ]}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          Automation platform
        </span>
        {(["zapier", "make"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPlatform(p)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              platform === p
                ? "bg-ink text-white"
                : "border border-border bg-card text-ink hover:bg-surface"
            }`}
          >
            {PLATFORM_LABELS[p]}
          </button>
        ))}
      </div>

      <div>
        <h4 className="text-sm font-semibold text-ink">Quick connect</h4>
        <p className="mt-1 text-xs text-muted">
          Pre-built setup guides for popular destinations. Payloads use flat field names
          Zapier and Make can map without code.
        </p>
        <ul className="mt-4 space-y-3">
          {WEBHOOK_QUICK_CONNECT_TEMPLATES.map((template) => {
            const open = expandedTemplate === template.id;
            return (
              <li
                key={template.id}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedTemplate(open ? null : template.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface/60"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">{template.title}</p>
                    <p className="text-xs text-muted">{template.description}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted">{open ? "−" : "+"}</span>
                </button>
                {open && (
                  <div className="border-t border-border px-4 py-4">
                    <p className="mb-3 text-xs font-semibold text-accent">
                      {PLATFORM_LABELS[platform]} action: {template.actionHint}
                    </p>
                    <ol className="space-y-2 text-sm text-ink">
                      {template.steps[platform].map((step, i) => (
                        <li key={step} className="flex gap-2">
                          <span className="shrink-0 font-semibold text-muted">{i + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-xl border border-border bg-surface/50 p-4">
        <h4 className="text-sm font-semibold text-ink">Webhook endpoint</h4>
        <p className="mt-1 text-xs text-muted">
          Paste your {PLATFORM_LABELS[platform]} Catch Hook / Custom webhook URL. See{" "}
          <Link href="/docs/zapier" className="font-semibold text-accent hover:underline">
            Zapier setup guide
          </Link>{" "}
          or{" "}
          <Link href="/docs/integrations" className="font-semibold text-accent hover:underline">
            all integrations
          </Link>
          .
        </p>

        <form onSubmit={(e) => void addEndpoint(e)} className="mt-4 space-y-3">
          <label className="block text-sm font-semibold text-ink">
            {PLATFORM_LABELS[platform]} webhook URL
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={
                platform === "zapier"
                  ? "https://hooks.zapier.com/hooks/catch/…"
                  : "https://hook.us1.make.com/…"
              }
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Signing secret
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Any random string — used for HMAC verification"
              className={inputClass}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyHookUrl}
              disabled={!url.trim()}
              className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-ink hover:bg-surface disabled:opacity-50"
            >
              Copy webhook URL
            </button>
            <button
              type="submit"
              disabled={saving || !url.trim() || !secret.trim()}
              className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white hover:bg-ink/90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save webhook"}
            </button>
            <button
              type="button"
              disabled={testingId === "draft" || !url.trim() || !secret.trim()}
              onClick={() =>
                void testEndpoint({ testUrl: url.trim(), testSecret: secret.trim() })
              }
              className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-ink hover:bg-surface disabled:opacity-50"
            >
              {testingId === "draft" ? "Sending…" : "Send test event"}
            </button>
          </div>
        </form>

        {loading ? (
          <p className="mt-4 text-xs text-muted">Loading endpoints…</p>
        ) : endpoints.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {endpoints.map((ep) => (
              <li
                key={ep.id}
                className="flex flex-col gap-2 rounded-lg border border-border bg-card px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <code className="truncate text-xs text-ink">{ep.url}</code>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={testingId === ep.id}
                    onClick={() => void testEndpoint({ endpointId: ep.id })}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface disabled:opacity-50"
                  >
                    {testingId === ep.id ? "Sending…" : "Send test"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeEndpoint(ep.id)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
