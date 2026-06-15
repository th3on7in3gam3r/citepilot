"use client";

import { useCallback, useEffect, useState } from "react";
import { FeatureGate } from "@/components/billing/FeatureGate";
import { useBilling } from "@/contexts/BillingContext";
import { useToast } from "@/components/notifications/ToastProvider";

type WebhookRow = {
  id: string;
  url: string;
  createdAt: string;
};

export function WebhookAlertsPanel({ workspaceId }: { workspaceId: string }) {
  const { isFleet, ready } = useBilling();
  const toast = useToast();
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
      toast.success("Webhook endpoint added");
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
      toast.success("Test webhook delivered", {
        description: data.status ? `HTTP ${data.status}` : undefined,
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

  if (!ready) {
    return <div className="mt-4 h-24 animate-pulse rounded-xl bg-surface" />;
  }

  if (!isFleet) {
    return (
      <div className="mt-6">
        <FeatureGate
          feature="webhook_alerts"
          title="Webhook alerts"
          description="Fleet plan — push citation.change_detected events to your stack with HMAC-signed JSON payloads."
          cta="Upgrade to Fleet →"
          highlights={[
            "Signed POST payloads",
            "Test delivery from settings",
            "Documented in Fleet API docs",
          ]}
        />
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-border bg-surface/50 p-4">
      <h3 className="text-sm font-semibold text-ink">Webhook endpoint</h3>
      <p className="mt-1 text-xs text-muted">
        Fleet only — receive signed JSON when citations change. See{" "}
        <a href="/docs/api#webhooks" className="font-semibold text-accent hover:underline">
          API docs
        </a>
        .
      </p>

      <form onSubmit={(e) => void addEndpoint(e)} className="mt-4 space-y-3">
        <label className="block text-sm font-semibold text-ink">
          URL
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://hooks.example.com/citepilot"
            className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-normal text-ink"
          />
        </label>
        <label className="block text-sm font-semibold text-ink">
          Signing secret
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="whsec_…"
            className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-normal text-ink"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving || !url.trim() || !secret.trim()}
            className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-ink hover:bg-surface disabled:opacity-50"
          >
            {saving ? "Adding…" : "Add webhook endpoint"}
          </button>
          <button
            type="button"
            disabled={testingId === "draft" || !url.trim() || !secret.trim()}
            onClick={() =>
              void testEndpoint({ testUrl: url.trim(), testSecret: secret.trim() })
            }
            className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-ink hover:bg-surface disabled:opacity-50"
          >
            {testingId === "draft" ? "Sending…" : "Send test payload"}
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
                  {testingId === ep.id ? "Testing…" : "Test"}
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
  );
}
