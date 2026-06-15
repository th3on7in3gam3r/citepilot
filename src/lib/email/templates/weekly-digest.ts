import { dashboardUrl } from "@/lib/email/config";
import { site, siteLogoUrl } from "@/lib/site";
import {
  buildEmailShell,
  emailBulletList,
  emailQuoteBlock,
  emailSectionTitle,
  emailStatCard,
  emailTagRow,
  escapeHtml,
} from "@/lib/email/templates/base-layout";
import type { WhiteLabelPreferences } from "@/lib/settings";
import {
  brandingFromPreferences,
  logoSrcForWorkspace,
  normalizePrimaryColor,
  poweredByFooterLines,
} from "@/lib/white-label/theme";
import { appBaseUrl } from "@/lib/stripe/config";

export type WeeklyDigestEmailInput = {
  domain: string;
  buyerQuestion: string;
  competitors: string[];
  score: number;
  previousScore: number | null;
  gaps: string[];
  whiteLabel?: WhiteLabelPreferences;
  workspaceId?: string;
  fleetBranding?: boolean;
};

function absoluteAssetUrl(pathOrUrl: string): string {
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  const base = appBaseUrl().replace(/\/$/, "");
  return `${base}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

function scoreDeltaHint(score: number, previousScore: number | null): {
  hint?: string;
  accent: string;
} {
  if (previousScore == null) {
    return { accent: "#0ea5e9" };
  }
  const delta = score - previousScore;
  if (delta > 0) {
    return {
      hint: `<span style="color:#10b981;font-weight:700">▲ +${delta}</span> vs last scan`,
      accent: "#10b981",
    };
  }
  if (delta < 0) {
    return {
      hint: `<span style="color:#ef4444;font-weight:700">▼ ${delta}</span> vs last scan`,
      accent: "#ef4444",
    };
  }
  return {
    hint: `<span style="color:#64748b">No change</span> vs last scan`,
    accent: "#0ea5e9",
  };
}

function buildDigestBodyHtml(input: WeeklyDigestEmailInput, primaryColor: string): string {
  const { hint, accent } = scoreDeltaHint(input.score, input.previousScore);
  const gaps = input.gaps.slice(0, 5);
  const competitors = input.competitors.slice(0, 6);

  const parts: string[] = [
    emailStatCard({
      label: "Citation score",
      value: `${input.score}`,
      hint: hint ? `${hint} · out of 100` : "out of 100",
      accent,
    }),
  ];

  if (input.buyerQuestion.trim()) {
    parts.push(
      emailSectionTitle("Money prompt"),
      emailQuoteBlock(input.buyerQuestion.trim(), primaryColor),
    );
  }

  if (gaps.length > 0) {
    parts.push(
      emailSectionTitle("Priority actions"),
      emailBulletList(gaps, primaryColor),
    );
  }

  if (competitors.length > 0) {
    parts.push(
      emailSectionTitle("Competitors on your radar"),
      emailTagRow(competitors),
    );
  }

  parts.push(
    `<p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#64748b">This digest summarizes your latest AI citation visibility for <strong style="color:#0f172a">${escapeHtml(input.domain)}</strong>. Open your dashboard for prompt-level proof and shareable client reports.</p>`,
  );

  return parts.join("");
}

function buildDigestPlainText(input: WeeklyDigestEmailInput): string {
  const lines = [
    `Weekly citation digest — ${input.domain}`,
    "",
    `Citation score: ${input.score}/100`,
  ];

  if (input.previousScore != null) {
    const delta = input.score - input.previousScore;
    lines.push(`Change vs last scan: ${delta >= 0 ? "+" : ""}${delta}`);
  }

  if (input.buyerQuestion.trim()) {
    lines.push("", "Money prompt:", input.buyerQuestion.trim());
  }

  const gaps = input.gaps.slice(0, 5);
  if (gaps.length > 0) {
    lines.push("", "Priority actions:");
    gaps.forEach((gap, i) => lines.push(`${i + 1}. ${gap}`));
  }

  if (input.competitors.length > 0) {
    lines.push("", "Competitors:", input.competitors.slice(0, 6).join(", "));
  }

  lines.push("", `Dashboard: ${dashboardUrl("/dashboard/analytics")}`);
  return lines.join("\n");
}

export function weeklyDigestSubject(domain: string, score: number): string {
  return `Weekly citation digest — ${domain} (${score}/100)`;
}

export function buildWeeklyDigestEmail(input: WeeklyDigestEmailInput): {
  html: string;
  text: string;
  subject: string;
} {
  const useFleet = input.fleetBranding && input.whiteLabel;
  const branding = useFleet ? brandingFromPreferences(input.whiteLabel!) : null;
  const primaryColor = branding?.primaryColor ?? "#0ea5e9";
  const bodyHtml = buildDigestBodyHtml(input, normalizePrimaryColor(primaryColor));

  const preheader =
    input.previousScore != null
      ? `${input.domain}: ${input.score}/100 (${input.score - input.previousScore >= 0 ? "+" : ""}${input.score - input.previousScore} vs last scan)`
      : `${input.domain}: citation score ${input.score}/100`;

  if (useFleet && branding) {
    const agency = branding.agencyName.trim() || "Your agency";
    const footer = poweredByFooterLines(branding);
    const logoUrl = absoluteAssetUrl(
      branding.logoUrl.trim() ||
        (input.workspaceId ? logoSrcForWorkspace(input.workspaceId, "") : ""),
    );

    return {
      subject: weeklyDigestSubject(input.domain, input.score),
      text: buildDigestPlainText(input),
      html: buildEmailShell({
        preheader,
        title: `${input.domain}`,
        headerEyebrow: "Weekly citation digest",
        bodyHtml,
        primaryColor: normalizePrimaryColor(primaryColor),
        logoUrl: logoUrl || undefined,
        logoAlt: agency,
        footerPrimary: footer.primary,
        footerSecondary: footer.secondary ?? undefined,
        cta: {
          href: dashboardUrl("/dashboard/analytics"),
          label: "Open analytics dashboard",
        },
        secondaryCta: {
          href: dashboardUrl("/report/proof"),
          label: "View proof report",
        },
      }),
    };
  }

  return {
    subject: weeklyDigestSubject(input.domain, input.score),
    text: buildDigestPlainText(input),
    html: buildEmailShell({
      preheader,
      title: input.domain,
      headerEyebrow: "Weekly citation digest",
      bodyHtml,
      primaryColor: "#0ea5e9",
      logoUrl: siteLogoUrl(),
      logoAlt: site.name,
      cta: {
        href: dashboardUrl("/dashboard/analytics"),
        label: "Open analytics dashboard",
      },
      secondaryCta: {
        href: dashboardUrl("/report/proof"),
        label: "View proof report",
      },
    }),
  };
}
