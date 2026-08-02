"use client";

import { useState } from "react";
import {
  brandingFromPreferences,
  logoSrcForWorkspace,
  normalizePoweredByMode,
  poweredByFooterLines,
} from "@/lib/white-label/theme";
import type { WhiteLabelBranding } from "@/lib/white-label/types";
import type { WorkspacePreferences } from "@/lib/settings";

export function ReportBrandingHeader({
  branding,
  whiteLabel,
  workspaceId,
  domain,
  subtitle,
  title,
}: {
  branding?: WhiteLabelBranding;
  whiteLabel?: WorkspacePreferences["whiteLabel"];
  workspaceId?: string;
  domain: string;
  subtitle?: string;
  title?: string;
}) {
  const resolved = branding ?? (whiteLabel ? brandingFromPreferences(whiteLabel) : null);
  const agencyName =
    resolved?.agencyName.trim() ||
    domain.split(".")[0] ||
    "Stakeholder report";

  const logoUrl =
    resolved?.logoUrl.trim() ||
    (workspaceId && !resolved?.logoUrl.trim()
      ? logoSrcForWorkspace(workspaceId, "")
      : "");

  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = Boolean(logoUrl) && !logoFailed;

  return (
    <div className="border-l-4 wl-accent-border pl-4">
      {showLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={agencyName}
          className="h-10 max-w-[220px] object-contain object-left"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <p className="font-display text-xl font-bold text-ink">{agencyName}</p>
      )}
      {title ? (
        <p className="mt-2 font-display text-lg font-semibold text-ink">{title}</p>
      ) : null}
      {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
    </div>
  );
}

export function ReportPoweredByFooter({
  branding,
  hidePoweredBy,
  agencyName,
}: {
  branding?: WhiteLabelBranding;
  /** @deprecated */
  hidePoweredBy?: boolean;
  agencyName?: string;
}) {
  const resolved: WhiteLabelBranding = branding ?? {
    agencyName: agencyName ?? "",
    logoUrl: "",
    hidePoweredBy: hidePoweredBy ?? false,
    poweredByMode: hidePoweredBy ? "agency_primary" : "agency_via_citepilot",
    primaryColor: "#0ea5e9",
  };

  if (hidePoweredBy === undefined && branding) {
    // use branding as-is
  } else if (hidePoweredBy !== undefined && !branding) {
    resolved.poweredByMode = normalizePoweredByMode(resolved);
  }

  const lines = poweredByFooterLines(resolved);

  return (
    <footer className="mt-12 border-t border-border pt-6 text-center text-xs text-muted print:mt-8">
      <p className="font-medium text-ink">{lines.primary}</p>
      {lines.secondary ? (
        <p className="mt-1 text-[10px] text-muted/80">{lines.secondary}</p>
      ) : null}
    </footer>
  );
}
