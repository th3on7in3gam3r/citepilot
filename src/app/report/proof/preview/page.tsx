"use client";

import { useEffect, useState } from "react";
import {
  ReportBrandingHeader,
  ReportPoweredByFooter,
} from "@/components/report/ReportBrandingHeader";
import { ReportThemeStyles } from "@/components/report/ReportThemeStyles";
import {
  DEFAULT_PRIMARY_COLOR,
  WHITE_LABEL_PREVIEW_KEY,
  type WhiteLabelPreviewState,
} from "@/lib/white-label/types";
import { normalizePrimaryColor, reportDocumentTitle } from "@/lib/white-label/theme";

const SAMPLE_DOMAIN = "acmeplumbing.com";

export default function ProofReportPreviewPage() {
  const [branding, setBranding] = useState<WhiteLabelPreviewState>({
    agencyName: "Sample Agency",
    logoUrl: "",
    hidePoweredBy: false,
    poweredByMode: "agency_via_citepilot",
    primaryColor: DEFAULT_PRIMARY_COLOR,
  });

  useEffect(() => {
    function load() {
      try {
        const raw = localStorage.getItem(WHITE_LABEL_PREVIEW_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as WhiteLabelPreviewState;
        setBranding({
          ...parsed,
          primaryColor: normalizePrimaryColor(parsed.primaryColor),
        });
      } catch {
        /* ignore */
      }
    }
    load();
    window.addEventListener("storage", load);
    const interval = setInterval(load, 800);
    return () => {
      window.removeEventListener("storage", load);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    document.title = reportDocumentTitle(SAMPLE_DOMAIN, branding.agencyName);
  }, [branding.agencyName]);

  const embed = typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("embed") === "1";

  return (
    <div className="min-h-[100dvh] bg-cream print:bg-white">
      <ReportThemeStyles primaryColor={branding.primaryColor} />
      {!embed && (
        <div className="border-b border-border bg-white px-6 py-3 text-center text-xs text-muted">
          Preview mode — sample data only
        </div>
      )}
      <header className="border-b border-border bg-white px-6 py-6">
        <div className="mx-auto max-w-5xl">
          <ReportBrandingHeader
            branding={branding}
            domain={SAMPLE_DOMAIN}
            title={reportDocumentTitle(SAMPLE_DOMAIN, branding.agencyName)}
            subtitle={`Proof report · ${SAMPLE_DOMAIN} · sample preview`}
          />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <ReportStat label="Citation score" value="72" accent />
          <ReportStat label="Prompts cited" value="4 / 6" />
          <ReportStat label="Platforms" value="3 / 5" />
        </div>
        <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl font-bold text-ink">Priority actions</h2>
          <ul className="mt-4 space-y-2 text-sm text-ink">
            <li className="flex gap-2">
              <span className="wl-accent-check font-bold">✓</span>
              Publish a direct answer page for top buyer prompt
            </li>
            <li className="flex gap-2">
              <span className="wl-accent-check font-bold">✓</span>
              Add structured FAQ schema on service pages
            </li>
          </ul>
          <button type="button" className="wl-cta mt-6 rounded-full px-5 py-2 text-sm font-semibold">
            View full report
          </button>
        </section>
      </main>
      <div className="mx-auto max-w-5xl px-6 pb-10">
        <ReportPoweredByFooter branding={branding} />
      </div>
    </div>
  );
}

function ReportStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-white p-5 shadow-sm ${accent ? "wl-accent-bg wl-accent-border" : ""}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-2 font-display text-3xl font-bold ${accent ? "wl-accent-text" : "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}
