"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { effectInit } from "@/lib/react/effect-init";
import { Panel } from "@/components/dashboard/DashboardUI";
import {
  FLEET_API_RATE_LIMIT_PER_HOUR,
  FLEET_API_RATE_LIMIT_PER_MINUTE,
} from "@/lib/fleet/constants";
import { useToast } from "@/components/notifications/ToastProvider";

type ApiKeyRow = {
  id: string;
  name: string;
  keyPrefix: string;
  workspaceId: string | null;
  createdAt: string;
  lastUsedAt: string | null;
};

export function FleetApiKeysPanel({ workspaceId }: { workspaceId: string }) {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [creating, setCreating] = useState(false);
  const toast = useToast();
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function loadKeys() {
    setLoadingKeys(true);
    const res = await fetch(
      `/api/fleet/api-keys?workspaceId=${encodeURIComponent(workspaceId)}`,
      { credentials: "include" },
    );
    if (res.ok) {
      const data = (await res.json()) as { keys: ApiKeyRow[] };
      setKeys(data.keys);
    }
    setLoadingKeys(false);
  }

  useEffect(() => {
    effectInit(() => {
      void loadKeys();
    });
  }, [workspaceId]);

  async function createKey() {
    setCreating(true);
    setNewSecret(null);
    setCopied(false);
    const res = await fetch("/api/fleet/api-keys", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Fleet API", workspaceId }),
    });
    const data = (await res.json()) as {
      key?: { secret: string };
      error?: string;
    };
    setCreating(false);
    if (!res.ok) {
      toast.error(data.error ?? "Could not create API key");
      return;
    }
    setNewSecret(data.key?.secret ?? null);
    toast.success("API key created — copy it now.");
    await loadKeys();
  }

  async function revokeKey(id: string) {
    await fetch(`/api/fleet/api-keys/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    toast.success("API key revoked.");
    await loadKeys();
  }

  async function copySecret() {
    if (!newSecret) return;
    try {
      await navigator.clipboard.writeText(newSecret);
      setCopied(true);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy — select the key manually");
    }
  }

  return (
    <Panel title="API Keys" className="mt-6" id="fleet-api-keys">
      <p className="mb-4 text-sm text-muted">
        Workspace-scoped keys for the{" "}
        <Link href="/docs/api" className="font-semibold text-accent hover:underline">
          Fleet REST API
        </Link>
        . Send{" "}
        <code className="text-xs">Authorization: Bearer ck_live_…</code> on each
        request. Limits: {FLEET_API_RATE_LIMIT_PER_MINUTE}/min,{" "}
        {FLEET_API_RATE_LIMIT_PER_HOUR}/hour.
      </p>

      {loadingKeys ? (
        <p className="text-sm text-muted">Loading API keys…</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {keys.length === 0 && (
            <li className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-muted">
              No API keys for this workspace yet.
            </li>
          )}
          {keys.map((key) => (
            <li
              key={key.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface px-4 py-3 dark:bg-[#141414]"
            >
              <div>
                <p className="font-semibold text-ink">{key.name}</p>
                <p className="font-mono text-xs text-muted">
                  {key.keyPrefix}…{" "}
                  <span className="text-muted/80">
                    · created {new Date(key.createdAt).toLocaleDateString()}
                    {key.lastUsedAt
                      ? ` · last used ${new Date(key.lastUsedAt).toLocaleString()}`
                      : ""}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => void revokeKey(key.id)}
                className="text-xs font-semibold text-red-600 hover:underline dark:text-red-400"
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        disabled={creating}
        onClick={() => void createKey()}
        className="mt-4 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {creating ? "Generating…" : "Generate API key"}
      </button>

      {newSecret && (
        <div className="mt-4 rounded-xl border border-amber-300/40 bg-amber-500/10 px-4 py-4 dark:border-amber-700/40 dark:bg-amber-950/30">
          <p className="text-sm font-semibold text-ink">
            New API key — shown once
          </p>
          <code className="mt-2 block break-all rounded-lg bg-black/20 px-3 py-2 font-mono text-xs text-foreground">
            {newSecret}
          </code>
          <button
            type="button"
            onClick={() => void copySecret()}
            className="mt-3 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface"
          >
            {copied ? "Copied ✓" : "Copy key"}
          </button>
        </div>
      )}
    </Panel>
  );
}
