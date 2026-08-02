"use client";

import { useCallback, useEffect, useState } from "react";
import type { FeatureRequest, FeatureRequestStatus } from "@/lib/feedback/store";

const STATUSES: FeatureRequestStatus[] = [
  "under_review",
  "planned",
  "in_progress",
  "shipped",
];

export function AdminFeatureRequestsPanel() {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/feedback/feature-requests", {
        credentials: "include",
      });
      if (res.ok) {
        const data = (await res.json()) as { requests: FeatureRequest[] };
        setRequests(data.requests);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateStatus(id: string, status: FeatureRequestStatus) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/feature-requests/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) await load();
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading feature requests…</p>;
  }

  if (requests.length === 0) {
    return <p className="text-sm text-muted">No feature requests yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-muted">
            <th className="px-3 py-2 font-semibold">Votes</th>
            <th className="px-3 py-2 font-semibold">Title</th>
            <th className="px-3 py-2 font-semibold">Status</th>
            <th className="px-3 py-2 font-semibold">Submitter</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id} className="border-b border-border/60">
              <td className="px-3 py-3 font-semibold text-ink">{request.voteCount}</td>
              <td className="px-3 py-3">
                <p className="font-medium text-ink">{request.title}</p>
                {request.description ? (
                  <p className="mt-1 text-xs text-muted">{request.description}</p>
                ) : null}
              </td>
              <td className="px-3 py-3">
                <select
                  value={request.status}
                  disabled={updatingId === request.id}
                  onChange={(e) =>
                    void updateStatus(request.id, e.target.value as FeatureRequestStatus)
                  }
                  className="rounded-lg border border-border bg-white px-2 py-1 text-sm"
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-3 text-xs text-muted">
                {request.submitterEmail ?? request.submittedBy ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
