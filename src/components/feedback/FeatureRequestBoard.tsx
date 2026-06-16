"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { FeatureRequest, FeatureRequestStatus } from "@/lib/feedback/store";
import { trackEvent } from "@/lib/analytics/track";

const STATUS_LABELS: Record<FeatureRequestStatus, string> = {
  under_review: "Under Review",
  planned: "Planned",
  in_progress: "In Progress",
  shipped: "Shipped",
};

const STATUS_STYLES: Record<FeatureRequestStatus, string> = {
  under_review: "bg-surface text-muted",
  planned: "bg-accent/10 text-accent",
  in_progress: "bg-amber-100 text-amber-900",
  shipped: "bg-mint/15 text-mint",
};

export function FeatureRequestBoard() {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [requestsRes, billingRes] = await Promise.all([
        fetch("/api/feedback/feature-requests", { credentials: "include" }),
        fetch("/api/billing/status", { credentials: "include" }),
      ]);
      if (requestsRes.ok) {
        const data = (await requestsRes.json()) as { requests: FeatureRequest[] };
        setRequests(data.requests);
      }
      if (billingRes.ok) {
        const billing = (await billingRes.json()) as { signedIn?: boolean };
        setSignedIn(Boolean(billing.signedIn));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback/feature-requests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const data = (await res.json()) as { error?: string; request?: FeatureRequest };
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/auth/sign-in?from=/feedback";
          return;
        }
        setError(data.error ?? "Could not submit request");
        return;
      }
      setTitle("");
      setDescription("");
      setMessage("Thanks — your request is live!");
      trackEvent("feature_request_submitted", { title: data.request?.title ?? title });
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleVote(id: string) {
    const res = await fetch(`/api/feedback/feature-requests/${id}/vote`, {
      method: "POST",
      credentials: "include",
    });
    if (res.status === 401) {
      window.location.href = "/auth/sign-in?from=/feedback";
      return;
    }
    if (!res.ok) return;
    const data = (await res.json()) as { voteCount: number; userVoted: boolean };
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, voteCount: data.voteCount, userVoted: data.userVoted } : r,
      ),
    );
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border bg-white p-6 shadow-sm"
      >
        <h2 className="font-display text-lg font-bold text-ink">Suggest a feature</h2>
        <p className="mt-1 text-sm text-muted">
          Share what you need — upvote ideas you want us to prioritize.
        </p>
        {message && (
          <p className="mt-3 rounded-xl border border-mint/30 bg-mint/10 px-4 py-3 text-sm text-ink">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}
        <div className="mt-4 space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Feature title"
            required
            minLength={4}
            maxLength={120}
            className="w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Why would this help your team?"
            rows={4}
            maxLength={2000}
            className="w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="mt-4 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-60"
        >
          {submitting ? "Submitting…" : signedIn ? "Submit request" : "Sign in to submit"}
        </button>
      </form>

      <div>
        <h2 className="font-display text-lg font-bold text-ink">Roadmap</h2>
        <p className="mt-1 text-sm text-muted">Sorted by community votes.</p>
        {loading ? (
          <p className="mt-6 text-sm text-muted">Loading requests…</p>
        ) : requests.length === 0 ? (
          <p className="mt-6 text-sm text-muted">No requests yet — be the first!</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {requests.map((request) => (
              <li
                key={request.id}
                className="flex gap-4 rounded-2xl border border-border bg-white p-4 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => void toggleVote(request.id)}
                  className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border text-sm font-bold transition ${
                    request.userVoted
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-surface text-muted hover:border-accent/40 hover:text-accent"
                  }`}
                  aria-label={request.userVoted ? "Remove upvote" : "Upvote"}
                >
                  <span aria-hidden>▲</span>
                  {request.voteCount}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-ink">{request.title}</h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLES[request.status]}`}
                    >
                      {STATUS_LABELS[request.status]}
                    </span>
                  </div>
                  {request.description ? (
                    <p className="mt-2 text-sm text-muted">{request.description}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-sm text-muted">
        Have a bug or account issue?{" "}
        <Link href="/dashboard/help" className="font-semibold text-accent hover:text-accent-deep">
          Visit Help →
        </Link>
      </p>
    </div>
  );
}
