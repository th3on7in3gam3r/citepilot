"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminDeleteKind = "workspace" | "waitlist" | "audit";

const paths: Record<AdminDeleteKind, (id: string) => string> = {
  workspace: (id) => `/api/admin/workspaces/${id}`,
  waitlist: (id) => `/api/admin/waitlist/${id}`,
  audit: (id) => `/api/admin/audits/${id}`,
};

const confirmMessages: Record<AdminDeleteKind, string> = {
  workspace:
    "Delete this workspace and all its audits, snapshots, and generated posts? This cannot be undone.",
  waitlist: "Remove this email from the waitlist?",
  audit: "Delete this audit run? This cannot be undone.",
};

export function AdminDeleteButton({
  kind,
  id,
  label = "Delete",
}: {
  kind: AdminDeleteKind;
  id: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!window.confirm(confirmMessages[kind])) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(paths[kind](id), {
        method: "DELETE",
        credentials: "include",
      });
      if (res.status === 401) {
        setError("Admin session expired. Please sign in again.");
        router.push("/admin/login?from=/admin");
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Delete failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Delete failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
      >
        {loading ? "…" : label}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
