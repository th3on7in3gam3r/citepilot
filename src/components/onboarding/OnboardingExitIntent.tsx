"use client";

import { useCallback, useEffect, useState } from "react";

export const ONBOARDING_EXIT_EMAIL_KEY = "citepilot_onboarding_email";

export function OnboardingExitIntent({
  active,
  completed,
}: {
  active: boolean;
  completed: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(ONBOARDING_EXIT_EMAIL_KEY);
    if (stored) {
      setEmail(stored);
      setSaved(true);
    }
  }, []);

  useEffect(() => {
    if (!active || completed || saved) return;

    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 8) setVisible(true);
    };

    document.addEventListener("mouseleave", onMouseLeave);
    return () => document.removeEventListener("mouseleave", onMouseLeave);
  }, [active, completed, saved]);

  const saveEmail = useCallback(() => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) return;
    localStorage.setItem(ONBOARDING_EXIT_EMAIL_KEY, trimmed);
    setSaved(true);
    setVisible(false);
  }, [email]);

  if (!visible || completed || saved) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-[pricing-price-in_0.28s_ease-out] rounded-2xl border border-border bg-white p-4 shadow-xl sm:left-auto sm:right-5"
      role="dialog"
      aria-label="Save your spot"
    >
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="absolute right-3 top-3 text-muted hover:text-ink"
        aria-label="Dismiss"
      >
        ×
      </button>
      <p className="pr-6 text-sm font-semibold text-ink">
        Save your spot — enter your email to get your audit results sent to you.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="min-w-0 flex-1 rounded-full border border-border px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
          onKeyDown={(e) => e.key === "Enter" && saveEmail()}
        />
        <button
          type="button"
          onClick={saveEmail}
          disabled={!email.trim().includes("@")}
          className="shrink-0 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-deep disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </div>
  );
}
