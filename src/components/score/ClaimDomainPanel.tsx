"use client";

import Link from "next/link";
import { useState } from "react";
import {
  VERIFICATION_DNS_PREFIX,
  VERIFICATION_META_NAME,
} from "@/lib/score/verification-constants";

type ClaimState = {
  token: string | null;
  verified: boolean;
  isPublic: boolean;
  loading: boolean;
  error: string | null;
  message: string | null;
};

export function ClaimDomainPanel({
  domain,
  initialVerified,
  initialIsPublic,
}: {
  domain: string;
  initialVerified: boolean;
  initialIsPublic: boolean;
}) {
  const [method, setMethod] = useState<"dns" | "meta">("dns");
  const [state, setState] = useState<ClaimState>({
    token: null,
    verified: initialVerified,
    isPublic: initialIsPublic,
    loading: false,
    error: null,
    message: null,
  });

  async function startClaim() {
    setState((s) => ({ ...s, loading: true, error: null, message: null }));
    try {
      const res = await fetch(`/api/score/${encodeURIComponent(domain)}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });
      const json = (await res.json()) as {
        token?: string;
        error?: string;
        verified?: boolean;
      };
      if (!res.ok) {
        setState((s) => ({
          ...s,
          loading: false,
          error: json.error ?? "Could not start claim",
        }));
        return;
      }
      setState((s) => ({
        ...s,
        loading: false,
        token: json.token ?? s.token,
        verified: json.verified ?? s.verified,
        message: json.verified
          ? "Domain verified — you can manage visibility below."
          : "Add the verification record, then click Verify.",
      }));
    } catch {
      setState((s) => ({ ...s, loading: false, error: "Network error" }));
    }
  }

  async function verifyClaim() {
    setState((s) => ({ ...s, loading: true, error: null, message: null }));
    try {
      const res = await fetch(`/api/score/${encodeURIComponent(domain)}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });
      const json = (await res.json()) as { verified?: boolean; error?: string };
      if (!res.ok || !json.verified) {
        setState((s) => ({
          ...s,
          loading: false,
          error: json.error ?? "Verification failed — check your DNS or meta tag.",
        }));
        return;
      }
      setState((s) => ({
        ...s,
        loading: false,
        verified: true,
        message: "Verified owner — badge added to this page.",
      }));
    } catch {
      setState((s) => ({ ...s, loading: false, error: "Network error" }));
    }
  }

  async function togglePrivacy(nextPublic: boolean) {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(`/api/score/${encodeURIComponent(domain)}/privacy`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: nextPublic }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setState((s) => ({
          ...s,
          loading: false,
          error: json.error ?? "Could not update visibility",
        }));
        return;
      }
      setState((s) => ({
        ...s,
        loading: false,
        isPublic: nextPublic,
        message: nextPublic
          ? "This score page is public and indexed again."
          : "This score page is now private and removed from search.",
      }));
    } catch {
      setState((s) => ({ ...s, loading: false, error: "Network error" }));
    }
  }

  const token = state.token;

  return (
    <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-lg font-bold text-ink">Claim this page</h2>
        {state.verified && (
          <span className="rounded-full bg-mint/15 px-2.5 py-0.5 text-xs font-semibold text-mint">
            Verified owner
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-muted">
        Own this domain? Verify ownership to manage visibility. Claimed pages can
        be marked private to remove them from search results.
      </p>

      {state.error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="mt-3 rounded-lg bg-mint/10 px-3 py-2 text-sm text-mint">
          {state.message}
        </p>
      )}

      {!state.verified && (
        <>
          <div className="mt-4 flex gap-2">
            {(["dns", "meta"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  method === m
                    ? "bg-accent text-white"
                    : "bg-cream text-muted hover:text-ink"
                }`}
              >
                {m === "dns" ? "DNS TXT" : "Meta tag"}
              </button>
            ))}
          </div>

          {!token ? (
            <button
              type="button"
              onClick={() => void startClaim()}
              disabled={state.loading}
              className="mt-4 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:opacity-60"
            >
              {state.loading ? "Starting…" : "Start verification"}
            </button>
          ) : (
            <div className="mt-4 space-y-3">
              {method === "dns" ? (
                <div className="rounded-xl bg-cream p-4 text-sm">
                  <p className="font-semibold text-ink">Add one TXT record in your domain&apos;s DNS</p>
                  <p className="mt-2 text-muted">
                    Log in where you manage DNS for <strong>{domain}</strong> (Cloudflare,
                    Vercel, GoDaddy, etc.) — not getcitepilot.com.
                  </p>
                  <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-[5.5rem_1fr]">
                    <dt className="font-semibold text-ink">Type</dt>
                    <dd className="text-muted">TXT</dd>
                    <dt className="font-semibold text-ink">Host</dt>
                    <dd className="text-muted">
                      Pick <strong>one</strong> (not both):
                      <ul className="mt-1.5 list-disc space-y-1 pl-4">
                        <li>
                          <code className="text-ink">@</code> or leave blank — most providers
                          (verifies the root domain)
                        </li>
                        <li>
                          <code className="text-ink">_citepilot-verify</code> — if your panel
                          does not allow <code className="text-ink">@</code>
                        </li>
                      </ul>
                    </dd>
                    <dt className="font-semibold text-ink">Value</dt>
                    <dd className="break-all font-mono text-xs text-ink">
                      {VERIFICATION_DNS_PREFIX}
                      {token}
                    </dd>
                  </dl>
                  <p className="mt-3 text-xs text-muted">
                    TXT is the record <em>type</em>; @ or _citepilot-verify is the{" "}
                    <em>host</em> field. After saving, wait a few minutes, then click Verify
                    below.{" "}
                    <Link
                      href="/help/public-score-pages"
                      className="font-semibold text-accent hover:text-accent-deep"
                    >
                      Full DNS guide →
                    </Link>
                  </p>
                </div>
              ) : (
                <div className="rounded-xl bg-cream p-4 text-sm">
                  <p className="font-semibold text-ink">Add to your homepage</p>
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs text-ink">
                    {`<meta name="${VERIFICATION_META_NAME}" content="${token}" />`}
                  </pre>
                </div>
              )}
              <button
                type="button"
                onClick={() => void verifyClaim()}
                disabled={state.loading}
                className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-deep disabled:opacity-60"
              >
                {state.loading ? "Checking…" : "Verify ownership"}
              </button>
            </div>
          )}
        </>
      )}

      {state.verified && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void togglePrivacy(false)}
            disabled={state.loading || !state.isPublic}
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-ink transition hover:bg-cream disabled:opacity-50"
          >
            Make private
          </button>
          <button
            type="button"
            onClick={() => void togglePrivacy(true)}
            disabled={state.loading || state.isPublic}
            className="rounded-xl border border-accent/30 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/5 disabled:opacity-50"
          >
            Make public
          </button>
        </div>
      )}
    </section>
  );
}
