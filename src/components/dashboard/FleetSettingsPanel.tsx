"use client";

import { useEffect, useRef, useState } from "react";
import { effectInit } from "@/lib/react/effect-init";
import { Panel } from "@/components/dashboard/DashboardUI";
import { FLEET_API_RATE_LIMIT_PER_HOUR } from "@/lib/fleet/constants";

type ApiKeyRow = {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
};

export function FleetSettingsPanel({
  workspaceId,
  onPromptsImported,
}: {
  workspaceId: string;
  onPromptsImported: (prompts: string[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadKeys() {
    setLoadingKeys(true);
    const res = await fetch("/api/fleet/api-keys", { credentials: "include" });
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
  }, []);

  async function createKey() {
    setCreating(true);
    setError(null);
    setMessage(null);
    setNewSecret(null);
    const res = await fetch("/api/fleet/api-keys", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Fleet API" }),
    });
    const data = (await res.json()) as {
      key?: { secret: string };
      error?: string;
    };
    setCreating(false);
    if (!res.ok) {
      setError(data.error ?? "Could not create API key");
      return;
    }
    setNewSecret(data.key?.secret ?? null);
    setMessage("API key created — copy it now.");
    await loadKeys();
  }

  async function revokeKey(id: string) {
    await fetch(`/api/fleet/api-keys/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    await loadKeys();
  }

  async function importCsv(file: File) {
    setImporting(true);
    setError(null);
    setMessage(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/workspaces/${workspaceId}/prompts/import`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    const data = (await res.json()) as {
      error?: string;
      imported?: number;
      trimmed?: boolean;
      monitoredPrompts?: string[];
    };
    setImporting(false);
    if (!res.ok) {
      setError(data.error ?? "Import failed");
      return;
    }
    setMessage(
      `Imported ${data.imported} prompt${data.imported === 1 ? "" : "s"}${
        data.trimmed ? " (trimmed to your plan limit)" : ""
      }.`,
    );
    if (data.monitoredPrompts) onPromptsImported(data.monitoredPrompts);
  }

  return (
    <>
      <Panel title="Fleet — bulk prompt import" className="mt-6">
        <p className="mb-4 text-sm text-muted">
          Upload a CSV with a <code className="text-xs">prompt</code> column or one
          prompt per line. Imports replace your monitored prompt list.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void importCsv(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={importing}
          onClick={() => fileRef.current?.click()}
          className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-surface disabled:opacity-50"
        >
          {importing ? "Importing…" : "Import prompts from CSV"}
        </button>
      </Panel>

      <Panel title="Fleet — API access" className="mt-6">
        <p className="mb-4 text-sm text-muted">
          Create API keys for programmatic JSON export. Send{" "}
          <code className="text-xs">Authorization: Bearer cp_fleet_…</code> or{" "}
          <code className="text-xs">X-API-Key</code>. Rate limit:{" "}
          {FLEET_API_RATE_LIMIT_PER_HOUR} requests/hour per key or session.
        </p>
        {loadingKeys ? (
          <p className="text-sm text-muted">Loading API keys…</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {keys.length === 0 && (
              <li className="text-muted">No API keys yet.</li>
            )}
            {keys.map((key) => (
              <li
                key={key.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-ink">{key.name}</p>
                  <p className="text-xs text-muted">
                    {key.keyPrefix}… · created{" "}
                    {new Date(key.createdAt).toLocaleDateString()}
                    {key.lastUsedAt
                      ? ` · last used ${new Date(key.lastUsedAt).toLocaleString()}`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void revokeKey(key.id)}
                  className="text-xs font-semibold text-red-600 hover:underline"
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
          className="mt-4 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {creating ? "Creating…" : "Create API key"}
        </button>
        {newSecret && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="font-semibold">New API key (copy now)</p>
            <code className="mt-2 block break-all text-xs">{newSecret}</code>
          </div>
        )}
      </Panel>

      {(message || error) && (
        <p
          className={`mt-4 text-sm ${error ? "text-red-600" : "text-mint"}`}
          role="status"
        >
          {error ?? message}
        </p>
      )}
    </>
  );
}
