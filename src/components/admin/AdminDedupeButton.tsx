"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminDedupeButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDedupe() {
    if (
      !window.confirm(
        "Remove duplicate workspaces (same user + domain)? Keeps the most recently updated copy.",
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/workspaces/dedupe", {
        method: "POST",
        credentials: "include",
      });

      if (res.status === 401) {
        setError("Admin session expired. Please sign in again.");
        router.push("/admin/login?from=/admin");
        return;
      }

      const data = (await res.json()) as {
        ok?: boolean;
        report?: { removed: number; kept: number };
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Dedupe failed");
        return;
      }
      setResult(
        `Removed ${data.report?.removed ?? 0} duplicate(s); kept ${data.report?.kept ?? 0} workspace(s).`,
      );
      router.refresh();
    } catch {
      setError("Dedupe failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={() => void handleDedupe()}
        disabled={loading}
        className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100 disabled:opacity-60"
      >
        {loading ? "Deduplicating…" : "Dedupe duplicate workspaces"}
      </button>
      {result && <p className="text-sm text-emerald-700">{result}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
