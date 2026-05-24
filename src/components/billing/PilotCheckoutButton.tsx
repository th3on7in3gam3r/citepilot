"use client";

import { useState } from "react";
import type { BillingPlan } from "@/lib/billing/types";

type Props = {
  plan?: Extract<BillingPlan, "pilot" | "fleet">;
  variant?: "accent" | "primary" | "dark";
  className?: string;
  children: React.ReactNode;
  signedIn?: boolean;
};

export function PilotCheckoutButton({
  plan = "pilot",
  variant = "dark",
  className = "",
  children,
  signedIn = false,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    if (!signedIn) {
      window.location.href = "/auth/sign-in?redirect=/pricing";
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Checkout failed");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error — try again");
    } finally {
      setLoading(false);
    }
  }

  const styles =
    variant === "dark"
      ? "bg-white text-ink hover:bg-white/90"
      : variant === "accent"
        ? "bg-accent text-white hover:bg-accent-deep"
        : "bg-ink text-white hover:bg-ink/90";

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => void startCheckout()}
        disabled={loading}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition disabled:opacity-60 ${styles}`}
      >
        {loading ? "Redirecting…" : children}
        {!loading && <span aria-hidden>→</span>}
      </button>
      {error && <p className="mt-2 text-center text-xs text-red-600">{error}</p>}
    </div>
  );
}
