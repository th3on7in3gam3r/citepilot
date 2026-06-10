"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Login failed");
      setLoading(false);
      return;
    }

    const from = searchParams.get("from") || "/admin";
    router.push(from);
    router.refresh();
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-cream px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-sm">
        <Logo className="mb-6" />
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          Internal
        </p>
        <h1 className="font-display mt-2 text-2xl font-bold text-ink">
          Admin sign-in
        </h1>
        <p className="mt-2 text-sm text-muted">
          Enter the admin secret from your server environment (
          <code className="text-xs">ADMIN_SECRET</code>).
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-ink">
            Admin secret
            <input
              type="password"
              required
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              suppressHydrationWarning
              className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-ink py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <Link
          href="/"
          className="mt-6 block text-center text-sm text-muted hover:text-ink"
        >
          ← Back to site
        </Link>
      </div>
    </div>
  );
}
