"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics/track";

type AuditFeedbackSurveyProps = {
  auditId?: string | null;
  workspaceId?: string | null;
  domain: string;
  score?: number | null;
  source?: "dashboard" | "public";
};

export function AuditFeedbackSurvey({
  auditId,
  workspaceId,
  domain,
  score,
  source = "dashboard",
}: AuditFeedbackSurveyProps) {
  const storageKey = `audit-feedback-${auditId ?? domain}-${source}`;
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<"ask" | "negative" | "done">("ask");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(storageKey)) {
      setStep("done");
      return;
    }
    setVisible(true);
  }, [storageKey]);

  async function submit(useful: boolean, feedbackComment?: string) {
    setSubmitting(true);
    try {
      await fetch("/api/feedback/audit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auditId,
          workspaceId,
          domain,
          score,
          useful,
          comment: feedbackComment,
          source,
        }),
      });
      trackEvent("audit_feedback_submitted", {
        domain,
        useful,
        score: score ?? undefined,
        source,
      });
      localStorage.setItem(storageKey, useful ? "yes" : "no");
      setStep("done");
      setVisible(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (!visible || step === "done") return null;

  return (
    <div className="rounded-2xl border border-border bg-surface/80 p-5">
      {step === "ask" ? (
        <>
          <p className="text-sm font-semibold text-ink">Was this audit useful?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => void submit(true)}
              className="rounded-full border border-mint/40 bg-mint/10 px-4 py-2 text-sm font-semibold text-ink hover:bg-mint/20 disabled:opacity-60"
            >
              👍 Yes
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => setStep("negative")}
              className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-surface disabled:opacity-60"
            >
              👎 No, here&apos;s why…
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-ink">What was missing or incorrect?</p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Tell us what confused you or felt wrong…"
            className="mt-3 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={submitting || comment.trim().length < 3}
              onClick={() => void submit(false, comment.trim())}
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-60"
            >
              {submitting ? "Sending…" : "Submit feedback"}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => setStep("ask")}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted hover:text-ink"
            >
              Back
            </button>
          </div>
        </>
      )}
    </div>
  );
}
