"use client";

import { useState, type FormEvent } from "react";
import { downloadGeoPlaybook } from "@/lib/marketing/geo-playbook";
import { trackEvent } from "@/lib/analytics/track";

export function GeoPlaybookEmailGate() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!clean) return;

    setLoading(true);
    setError(null);
    trackEvent("tool_used", { tool_name: "geo-playbook", action: "pdf_gate" });

    try {
      const res = await fetch("/api/tools/geo-playbook/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok && !data.ok) {
        setError(data.error ?? "Could not subscribe");
        return;
      }
      downloadGeoPlaybook();
      setDone(true);
      trackEvent("tool_result_viewed", {
        tool_name: "geo-playbook",
        action: "pdf_download",
      });
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="geo-pdf-gate"
      className="scroll-mt-28 rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/5 to-surface p-6 md:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">
        PDF + newsletter
      </p>
      <h2 className="font-display mt-2 text-xl font-bold text-ink md:text-2xl">
        Get the PDF + weekly GEO tips
      </h2>
      <p className="mt-2 text-sm text-muted">
        Download the full playbook markdown export and join our Resend list for GEO
        tactics, citation benchmarks, and product updates.
      </p>

      {done ? (
        <p className="mt-4 text-sm font-semibold text-accent">
          Check your inbox — your download should start automatically.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            required
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-accent/30"
          />
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Sending…" : "Get PDF + tips"}
          </button>
        </form>
      )}
      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}
    </section>
  );
}
