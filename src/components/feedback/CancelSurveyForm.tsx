"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { CancelSurveyReason } from "@/lib/feedback/store";
import { trackEvent } from "@/lib/analytics/track";

const REASONS: { id: CancelSurveyReason; label: string }[] = [
  { id: "too_expensive", label: "Too expensive" },
  { id: "not_enough_value", label: "Not getting enough value" },
  { id: "switching_competitor", label: "Switching to a competitor" },
  { id: "just_testing", label: "Just testing — will come back" },
  { id: "missing_feature", label: "Missing a feature I need" },
  { id: "technical_issues", label: "Technical issues" },
];

export function CancelSurveyForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState<CancelSurveyReason | "">("");
  const [competitor, setCompetitor] = useState("");
  const [missingFeature, setMissingFeature] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/feedback/cancel-survey", { credentials: "include" })
      .then(async (res) => {
        if (res.status === 401) {
          router.replace("/auth/sign-in?from=/cancel-survey");
          return;
        }
        if (!res.ok) return;
        const data = (await res.json()) as {
          submitted?: boolean;
          status?: string;
          isPaid?: boolean;
        };
        if (data.submitted) {
          router.replace("/?cancelled=1");
          return;
        }
        if (data.isPaid && data.status !== "canceled") {
          router.replace("/dashboard/settings?billing=portal_return");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) {
      setError("Please select a reason");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback/cancel-survey", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          competitor: reason === "switching_competitor" ? competitor : undefined,
          missingFeature: reason === "missing_feature" ? missingFeature : undefined,
          details,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Could not submit survey");
        return;
      }
      trackEvent("cancel_survey_submitted", { reason });
      router.replace("/?cancelled=1");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-ink">
          Before you go — what&apos;s the main reason you&apos;re cancelling?
        </legend>
        {REASONS.map((item) => (
          <label
            key={item.id}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm hover:border-accent/40"
          >
            <input
              type="radio"
              name="reason"
              value={item.id}
              checked={reason === item.id}
              onChange={() => setReason(item.id)}
              className="h-4 w-4 accent-accent"
            />
            {item.label}
          </label>
        ))}
      </fieldset>

      {reason === "switching_competitor" && (
        <div>
          <label className="text-sm font-medium text-ink" htmlFor="competitor">
            Which competitor?
          </label>
          <input
            id="competitor"
            value={competitor}
            onChange={(e) => setCompetitor(e.target.value)}
            className="mt-2 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            placeholder="e.g. Semrush, Ahrefs…"
          />
        </div>
      )}

      {reason === "missing_feature" && (
        <div>
          <label className="text-sm font-medium text-ink" htmlFor="missing-feature">
            Which feature?
          </label>
          <input
            id="missing-feature"
            value={missingFeature}
            onChange={(e) => setMissingFeature(e.target.value)}
            className="mt-2 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            placeholder="Describe the feature you needed"
          />
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-ink" htmlFor="details">
          Anything else? (optional)
        </label>
        <textarea
          id="details"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={3}
          className="mt-2 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          placeholder="Optional details for our team"
        />
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit & continue"}
      </button>
    </form>
  );
}
