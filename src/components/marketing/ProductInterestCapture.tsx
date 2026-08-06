"use client";

import { useState, type FormEvent } from "react";
import { trackEvent } from "@/lib/analytics/track";
import { joinWaitlist } from "@/lib/client/api";

export function ProductInterestCapture() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!clean) return;

    setStatus("loading");
    setErrorMsg("");
    try {
      const ok = await joinWaitlist(clean);
      if (!ok) {
        setStatus("error");
        setErrorMsg("Could not save that email. Try again or use the free audit.");
        return;
      }
      setStatus("done");
      trackEvent("product_waitlist_submitted");
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Try again or email hello@getcitepilot.com.");
    }
  }

  if (status === "done") {
    return (
      <p className="mt-8 text-sm font-semibold text-accent" role="status">
        Thanks — we&apos;ll follow up. Or run a free audit anytime above.
      </p>
    );
  }

  return (
    <div className="mx-auto mt-8 w-full max-w-md">
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="flex flex-col gap-3 sm:flex-row sm:items-stretch"
        noValidate
      >
        <label className="sr-only" htmlFor="product-waitlist-email">
          Work email
        </label>
        <input
          id="product-waitlist-email"
          type="email"
          required
          autoComplete="email"
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Work email"
          disabled={status === "loading"}
          className="min-w-0 flex-1 rounded-full border border-white/20 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={status === "loading" || !email.trim()}
          className="shrink-0 rounded-full border border-white/25 px-5 py-3 text-sm font-semibold text-white/90 transition hover:border-white/50 disabled:opacity-50"
        >
          {status === "loading" ? "Saving…" : "Get product updates"}
        </button>
      </form>
      {status === "error" && (
        <p className="mt-2 text-left text-xs text-red-300 sm:text-center" role="alert">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
