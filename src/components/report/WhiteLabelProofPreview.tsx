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

const DEFAULT_BRANDING: WhiteLabelPreviewState = {
  agencyName: "Sample Agency",
  logoUrl: "",
  hidePoweredBy: false,
  poweredByMode: "agency_via_citepilot",
  primaryColor: DEFAULT_PRIMARY_COLOR,
};

export function WhiteLabelProofPreview({
  branding: brandingProp,
  embed = false,
}: {
  /** When provided, renders directly from settings state (no iframe / localStorage). */
  branding?: WhiteLabelPreviewState;
  embed?: boolean;
}) {
  const [storedBranding, setStoredBranding] = useState<WhiteLabelPreviewState>(DEFAULT_BRANDING);

  useEffect(() => {
    if (brandingProp) return;

    function load() {
      try {
        const raw = localStorage.getItem(WHITE_LABEL_PREVIEW_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as WhiteLabelPreviewState;
        setStoredBranding({
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
  }, [brandingProp]);

  const branding = brandingProp ?? storedBranding;
  const primaryColor = normalizePrimaryColor(branding.primaryColor);

  useEffect(() => {
    if (embed || brandingProp) return;
    document.title = reportDocumentTitle(SAMPLE_DOMAIN, branding.agencyName);
  }, [branding.agencyName, embed, brandingProp]);

  return (
    <div
      className={
        embed
          ? "overflow-hidden rounded-xl border border-border bg-cream"
          : "min-h-[100dvh] bg-cream print:bg-white"
      }
    >
      <ReportThemeStyles primaryColor={primaryColor} />
      {!embed && (
        <div className="border-b border-border bg-white px-6 py-3 text-center text-xs text-muted">
          Preview mode — sample data only
        </div>
      )}
      <header className="border-b border-border bg-white px-4 py-4 sm:px-6 sm:py-6">
        <div className={embed ? "" : "mx-auto max-w-5xl"}>
          <ReportBrandingHeader
            branding={{ ...branding, primaryColor }}
            domain={SAMPLE_DOMAIN}
            title={reportDocumentTitle(SAMPLE_DOMAIN, branding.agencyName)}
            subtitle={`Proof report · ${SAMPLE_DOMAIN} · sample preview`}
          />
        </div>
      </header>
      <main className={embed ? "px-4 py-4" : "mx-auto max-w-5xl px-6 py-8"}>
        <div className="grid gap-3 sm:grid-cols-3">
          <ReportStat label="Citation score" value="72" accent />
          <ReportStat label="Prompts cited" value="4 / 6" />
          <ReportStat label="Platforms" value="3 / 5" />
        </div>
        <section className="mt-4 rounded-2xl border border-border bg-white p-4 shadow-sm sm:mt-6 sm:p-6">
          <h2 className="font-display text-lg font-bold text-ink sm:text-xl">Priority actions</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink">
            <li className="flex gap-2">
              <span className="wl-accent-check font-bold">✓</span>
              Publish a direct answer page for top buyer prompt
            </li>
            <li className="flex gap-2">
              <span className="wl-accent-check font-bold">✓</span>
              Add structured FAQ schema on service pages
            </li>
          </ul>
          <button
            type="button"
            className="wl-cta mt-4 rounded-full px-5 py-2 text-sm font-semibold sm:mt-6"
          >
            View full report
          </button>
        </section>
      </main>
      <div className={embed ? "px-4 pb-4" : "mx-auto max-w-5xl px-6 pb-10"}>
        <ReportPoweredByFooter branding={{ ...branding, primaryColor }} />
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
      className={`rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-5 ${accent ? "wl-accent-bg wl-accent-border" : ""}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p
        className={`mt-2 font-display text-2xl font-bold sm:text-3xl ${accent ? "wl-accent-text" : "text-ink"}`}
      >
        {value}
      </p>
    </div>
  );
}
