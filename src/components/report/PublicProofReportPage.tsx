"use client";

import { useCallback, useEffect, useState } from "react";
import {
  buildShareTweet,
  linkedInShareUrl,
  twitterShareUrl,
} from "@/lib/audit/share-social";
import type { SharedAuditView } from "@/lib/audit/share";
import {
  ReportBrandingHeader,
  ReportPoweredByFooter,
} from "@/components/report/ReportBrandingHeader";
import { ReportThemeStyles } from "@/components/report/ReportThemeStyles";
import { ProofReportGetOwnCta } from "@/components/report/ProofReportGetOwnCta";
import { trackEvent } from "@/lib/analytics/track";
import { reportDocumentTitle } from "@/lib/white-label/theme";
import { site } from "@/lib/site";

function unlockKey(token: string) {
  return `citepilot_share_unlock_${token}`;
}

export function PublicProofReportPage({ token }: { token: string }) {
  const [data, setData] = useState<SharedAuditView | null>(null);
  const [error, setError] = useState<"not_found" | "expired" | null>(null);
  const [password, setPassword] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/audit/share/${token}`);
    if (res.status === 410) {
      setError("expired");
      return;
    }
    if (!res.ok) {
      setError("not_found");
      return;
    }

    const json = (await res.json()) as SharedAuditView & { requiresPassword?: boolean };
    setData(json);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!data?.audit?.domain || data.requiresPassword || data.expired) return;
    trackEvent("proof_report_viewed", {
      domain: data.domain,
      token,
      public: true,
    });
  }, [data, token]);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setUnlocking(true);
    setUnlockError("");
    try {
      const res = await fetch(`/api/audit/share/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setUnlockError("Incorrect password. Try again.");
        return;
      }
      sessionStorage.setItem(unlockKey(token), "1");
      setData(await res.json());
    } finally {
      setUnlocking(false);
    }
  }

  if (error === "expired") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-cream p-8 text-center">
        <div>
          <p className="font-display text-lg font-bold text-ink">Report expired</p>
          <p className="mt-2 text-sm text-muted">
            This report has expired. Request a new one from the workspace owner.
          </p>
        </div>
      </div>
    );
  }

  if (error === "not_found") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-cream p-8">
        <p className="text-muted">This report link is invalid or was removed.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-cream">
        <p className="text-muted">Loading proof report…</p>
      </div>
    );
  }

  if (data.requiresPassword && !data.audit?.id) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-cream p-6">
        <form
          onSubmit={(e) => void unlock(e)}
          className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-sm"
        >
          <h1 className="font-display text-xl font-bold text-ink">Protected report</h1>
          <p className="mt-2 text-sm text-muted">
            Enter the password to view the proof report for{" "}
            <strong className="text-ink">{data.domain}</strong>.
          </p>
          <label className="mt-6 block text-sm font-semibold text-ink">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border px-4 py-3 text-sm"
              autoFocus
            />
          </label>
          {unlockError && (
            <p className="mt-2 text-sm text-red-600">{unlockError}</p>
          )}
          <button
            type="submit"
            disabled={unlocking || !password.trim()}
            className="mt-6 w-full rounded-full bg-ink py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {unlocking ? "Unlocking…" : "View report"}
          </button>
        </form>
      </div>
    );
  }

  const audit = data.audit;
  const generatedAt = new Date(data.createdAt).toLocaleString();
  const pdfTitle = reportDocumentTitle(audit.domain, data.branding.agencyName);
  const reportUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/report/proof/${token}`
      : `${site.url}/report/proof/${token}`;

  const tweet = buildShareTweet({
    domain: audit.domain,
    score: audit.score,
    citedPrompts: audit.cited,
    totalPrompts: audit.total,
    reportUrl,
  });

  return (
    <div className="relative min-h-[100dvh] bg-cream print:bg-white citepilot-print-report">
      <ReportThemeStyles primaryColor={data.branding.primaryColor} />
      <header className="border-b border-border bg-white px-6 py-6 print:border-0">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <ReportBrandingHeader
              branding={data.branding}
              workspaceId={data.branding.workspaceId}
              domain={audit.domain}
              title={pdfTitle}
              subtitle={`Proof report · ${audit.domain} · ${generatedAt}`}
            />
          </div>
          <div className="flex flex-wrap gap-2 citepilot-no-print">
            <a
              href={twitterShareUrl(tweet)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent("proof_report_share_clicked", { channel: "twitter", token })
              }
              className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
            >
              Share on X
            </a>
            <a
              href={linkedInShareUrl(reportUrl)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent("proof_report_share_clicked", { channel: "linkedin", token })
              }
              className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
            >
              Share on LinkedIn
            </a>
            <button
              type="button"
              onClick={() => {
                document.title = pdfTitle;
                window.print();
              }}
              className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
            >
              Export PDF
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 print:py-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ReportStat label="Citation score" value={`${audit.score}/100`} />
          <ReportStat label="GEO score" value={`${audit.siteSignals?.geoScore ?? audit.score}/100`} />
          <ReportStat label="Prompts cited" value={`${audit.cited}/${audit.total}`} />
          <ReportStat label="Platforms" value={String(audit.platforms?.filter((p) => p.present).length ?? 0)} />
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-sm print:shadow-none">
          <h2 className="font-display text-xl font-bold text-ink">Platform presence</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {audit.platforms.map((p) => (
              <li
                key={p.name}
                className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 text-sm"
              >
                <span className="font-medium text-ink">{p.name}</span>
                <span className={p.present ? "font-semibold text-mint" : "text-muted"}>
                  {p.present ? `${p.share}%` : "Not cited"}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-sm print:shadow-none">
          <h2 className="font-display text-xl font-bold text-ink">Priority fixes</h2>
          <ol className="mt-4 space-y-2">
            {audit.gaps.slice(0, 6).map((gap, i) => (
              <li
                key={gap}
                className="flex gap-3 rounded-xl bg-surface px-4 py-3 text-sm text-muted"
              >
                <span className="font-semibold text-accent">{i + 1}</span>
                <span>{gap}</span>
              </li>
            ))}
          </ol>
        </section>

        {audit.promptResults.length > 0 && (
          <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-sm print:shadow-none">
            <h2 className="font-display text-xl font-bold text-ink">Prompt-level proof</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted">
                    <th className="pb-3 pr-4">Prompt</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.promptResults.map((row) => (
                    <tr key={row.prompt} className="border-b border-border last:border-0">
                      <td className="max-w-md py-3 pr-4 font-medium text-ink">{row.prompt}</td>
                      <td className="py-3 text-ink">
                        {row.cited ? "Cited" : "Not cited"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <ProofReportGetOwnCta domainHint={audit.domain} />
      </main>

      <div className="mx-auto max-w-5xl px-6 pb-10 citepilot-print-only-watermark">
        <ReportPoweredByFooter branding={data.branding} />
      </div>
    </div>
  );
}

function ReportStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm print:shadow-none">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold text-ink">{value}</p>
    </div>
  );
}
