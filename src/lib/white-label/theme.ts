import type { WhiteLabelBranding, WhiteLabelPoweredByMode } from "@/lib/white-label/types";
import { DEFAULT_PRIMARY_COLOR } from "@/lib/white-label/types";
import type { WorkspacePreferences } from "@/lib/settings";

export function normalizePrimaryColor(raw: string | undefined | null): string {
  const trimmed = raw?.trim() ?? "";
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const h = trimmed.slice(1);
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
  }
  return DEFAULT_PRIMARY_COLOR;
}

export function normalizePoweredByMode(
  branding: Pick<WhiteLabelBranding, "poweredByMode" | "hidePoweredBy">,
): WhiteLabelPoweredByMode {
  if (branding.poweredByMode === "agency_primary" || branding.poweredByMode === "agency_via_citepilot") {
    return branding.poweredByMode;
  }
  return branding.hidePoweredBy ? "agency_primary" : "agency_via_citepilot";
}

export function brandingFromPreferences(
  whiteLabel: WorkspacePreferences["whiteLabel"],
): WhiteLabelBranding {
  return {
    agencyName: whiteLabel.agencyName,
    logoUrl: whiteLabel.logoUrl,
    hidePoweredBy: whiteLabel.hidePoweredBy,
    poweredByMode: normalizePoweredByMode(whiteLabel),
    primaryColor: normalizePrimaryColor(whiteLabel.primaryColor),
  };
}

export function reportDocumentTitle(domain: string, agencyName: string): string {
  const agency = agencyName.trim() || "Your agency";
  return `${domain} Citation Report — Prepared by ${agency}`;
}

export function poweredByFooterLines(
  branding: WhiteLabelBranding,
): { primary: string; secondary: string | null } {
  const agency = branding.agencyName.trim() || "Your agency";
  const mode = normalizePoweredByMode(branding);

  if (mode === "agency_primary") {
    return {
      primary: `Powered by ${agency}`,
      secondary: "Report technology by CitePilot",
    };
  }

  return {
    primary: `Powered by ${agency} via CitePilot`,
    secondary: null,
  };
}

export function logoSrcForWorkspace(
  workspaceId: string,
  logoUrl: string,
): string {
  const trimmed = logoUrl.trim();
  if (trimmed) return trimmed;
  return `/api/white-label/logo?workspaceId=${encodeURIComponent(workspaceId)}`;
}
