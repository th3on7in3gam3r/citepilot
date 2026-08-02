export type WhiteLabelPoweredByMode = "agency_primary" | "agency_via_citepilot";

export type WhiteLabelBranding = {
  agencyName: string;
  logoUrl: string;
  /** @deprecated use poweredByMode */
  hidePoweredBy: boolean;
  poweredByMode: WhiteLabelPoweredByMode;
  primaryColor: string;
};

export type WhiteLabelPreviewState = WhiteLabelBranding & {
  customReportDomain?: string;
  emailFromName?: string;
};

export const WHITE_LABEL_PREVIEW_KEY = "citepilot_wl_preview";

export const DEFAULT_PRIMARY_COLOR = "#0ea5e9";
