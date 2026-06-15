"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { SharedAuditView } from "@/lib/audit/share";

export default function SharedAuditPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [data, setData] = useState<SharedAuditView | null>(null);
  const [error, setError] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    void params.then((p) => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    void fetch(`/api/audit/share/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((d: SharedAuditView) => setData(d))
      .catch(() => setError(true));
  }, [token]);

  if (error) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-cream p-8">
        <p className="text-muted">This audit link is invalid or expired.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-cream">
        <p className="text-muted">Loading report…</p>
      </div>
    );
  }

  const { audit, branding } = data;

  return (
    <div className="min-h-[100dvh] bg-cream print:bg-white">
      <header className="border-b border-border bg-white px-6 py-6 print:border-0">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div>
            {branding.logoUrl ? (
              <Image
                src={branding.logoUrl}
                alt=""
                width={160}
                height={40}
                className="h-10 w-auto object-contain"
                sizes="160px"
              />
            ) : (
              <p className="font-display text-xl font-bold text-ink">
                {branding.agencyName}
              </p>
            )}
            <p className="mt-1 text-sm text-muted">GEO audit — {audit.domain}</p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white print:hidden"
          >
            Export PDF
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 print:py-6">
        <div className="grid gap-4 sm:grid-cols-3 print:grid-cols-3">
          <Stat label="Citation score" value={`${audit.score}/100`} />
          <Stat label="Prompts cited" value={`${audit.cited}/${audit.total}`} />
          <Stat label="GEO score" value={`${audit.siteSignals.geoScore}/100`} />
        </div>

        <section className="mt-10 print:mt-6">
          <h2 className="font-display text-lg font-bold text-ink">Priority fixes</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {audit.gaps.map((g) => (
              <li
                key={g}
                className="rounded-xl bg-white px-4 py-3 shadow-sm print:border print:border-border print:shadow-none"
              >
                {g}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 print:mt-6">
          <h2 className="font-display text-lg font-bold text-ink">Platform presence</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {audit.platforms.map((p) => (
              <li
                key={p.name}
                className="flex justify-between rounded-xl bg-white px-4 py-3 text-sm shadow-sm print:border print:border-border print:shadow-none"
              >
                <span>{p.name}</span>
                <span className={p.present ? "text-emerald-600" : "text-muted"}>
                  {p.present ? `${p.share}%` : "Not detected"}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {!branding.hidePoweredBy && (
          <p className="mt-12 text-center text-xs text-muted print:mt-8">
            Report generated with{" "}
            <a href="https://getcitepilot.com" className="text-accent">
              CitePilot
            </a>
          </p>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm print:shadow-none">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="font-display mt-2 text-3xl font-bold text-ink">{value}</p>
    </div>
  );
}
