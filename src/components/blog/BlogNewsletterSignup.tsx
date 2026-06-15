"use client";

import { useState } from "react";

export function BlogNewsletterSignup({
  variant = "inline",
}: {
  variant?: "inline" | "card";
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; error?: string };
      if (res.ok && data.ok) {
        setStatus("done");
        return;
      }
      setErrorMsg(data.error ?? "Something went wrong — try again.");
      setStatus("error");
    } catch {
      setErrorMsg("Something went wrong — try again.");
      setStatus("error");
    }
  }

  const card = variant === "card";

  return (
    <div
      className={
        card
          ? "rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 to-white/[0.04] p-6 md:p-8"
          : ""
      }
    >
      <p
        className={`text-xs font-semibold uppercase tracking-wider ${
          card ? "text-glow" : "text-accent"
        }`}
      >
        Weekly GEO brief
      </p>
      <h2
        className={`font-display mt-2 font-bold ${
          card ? "text-xl text-white md:text-2xl" : "text-lg text-ink"
        }`}
      >
        Get the weekly GEO brief
      </h2>
      <p
        className={`mt-2 text-sm leading-relaxed ${
          card ? "text-white/55" : "text-muted"
        }`}
      >
        Citation trends, prompt patterns, and one actionable fix — free, no
        spam.
      </p>

      {status === "done" ? (
        <p
          className={`mt-4 text-sm font-semibold ${
            card ? "text-mint" : "text-accent"
          }`}
        >
          You&apos;re in — check your inbox.
        </p>
      ) : (
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="mt-4 flex flex-col gap-2 sm:flex-row"
        >
          <input
            type="email"
            required
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`min-w-0 flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-accent ${
              card
                ? "border-white/15 bg-white/5 text-white placeholder:text-white/30"
                : "border-border bg-white text-ink"
            }`}
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="shrink-0 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-deep disabled:opacity-60"
          >
            {status === "loading" ? "Joining…" : "Subscribe"}
          </button>
        </form>
      )}
      {status === "error" && (
        <p className="mt-2 text-xs text-red-400">{errorMsg}</p>
      )}
    </div>
  );
}
