"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function CancelledBanner() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("cancelled") === "1") {
      setVisible(true);
      window.history.replaceState({}, "", "/");
    }
  }, [searchParams]);

  if (!visible) return null;

  return (
    <div className="border-b border-border bg-white px-4 py-3 text-center text-sm text-ink">
      Your subscription has been cancelled. You can restart anytime from{" "}
      <a href="/pricing" className="font-semibold text-accent hover:text-accent-deep">
        Pricing
      </a>
      .
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="ml-3 text-muted hover:text-ink"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
