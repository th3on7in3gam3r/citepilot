"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "citepilot-cookie-consent";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const accepted = localStorage.getItem(STORAGE_KEY);
      if (!accepted) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      // ignore storage failures
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-border bg-ink px-4 py-3 text-white shadow-[0_-8px_32px_rgba(0,0,0,0.2)]"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p className="text-sm leading-relaxed text-white/75">
          We use privacy-friendly analytics (Plausible) to understand site usage.
          No ad trackers or cross-site profiling.
        </p>
        <button
          type="button"
          onClick={accept}
          className="shrink-0 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accent-deep"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
