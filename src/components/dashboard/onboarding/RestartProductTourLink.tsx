"use client";

import { useState } from "react";
import { clearTourCompletedLocal } from "@/lib/onboarding/tour";

export function RestartProductTourLink() {
  const [busy, setBusy] = useState(false);

  async function handleRestart() {
    setBusy(true);
    try {
      await fetch("/api/onboarding/tour", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restart" }),
      });
      clearTourCompletedLocal();
      window.location.href = "/dashboard?tour=restart";
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void handleRestart()}
      className="mt-4 text-sm font-semibold text-accent hover:underline disabled:opacity-60"
    >
      {busy ? "Restarting…" : "Restart product tour"}
    </button>
  );
}
