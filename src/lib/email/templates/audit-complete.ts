import { dashboardUrl } from "@/lib/email/config";
import { site, siteLogoUrl } from "@/lib/site";
import {
  buildEmailShell,
  emailBulletList,
  emailSectionTitle,
  emailStatCard,
  emailTagRow,
  escapeHtml,
} from "@/lib/email/templates/base-layout";

export type AuditCompleteEmailInput = {
  domain: string;
  score: number;
  cited: number;
  total: number;
  gaps: string[];
  previousScore?: number | null;
  variant?: "complete" | "score_drop";
};

function scoreAccent(score: number): string {
  if (score >= 70) return "#10b981";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

function scoreDeltaHint(score: number, previousScore: number | null | undefined): string | undefined {
  if (previousScore == null) return undefined;
  const delta = score - previousScore;
  if (delta > 0) {
    return `<span style="color:#10b981;font-weight:700">▲ +${delta}</span> vs last audit`;
  }
  if (delta < 0) {
    return `<span style="color:#ef4444;font-weight:700">▼ ${delta}</span> vs last audit`;
  }
  return `<span style="color:#64748b">No change</span> vs last audit`;
}

function buildBodyHtml(input: AuditCompleteEmailInput, primaryColor: string): string {
  const accent = scoreAccent(input.score);
  const gaps = input.gaps.slice(0, 5);
  const citationRate =
    input.total > 0 ? `${input.cited}/${input.total} prompts cited` : "No prompts tracked yet";

  const parts: string[] = [
    emailStatCard({
      label: "Citation score",
      value: `${input.score}`,
      hint: [scoreDeltaHint(input.score, input.previousScore), "out of 100"]
        .filter(Boolean)
        .join(" · "),
      accent,
    }),
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 0">
<tr><td style="padding:14px 18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px">
<p style="margin:0;font-size:13px;color:#64748b"><strong style="color:#0f172a">${escapeHtml(citationRate)}</strong></p>
</td></tr></table>`,
  ];

  if (input.variant === "score_drop" && input.previousScore != null) {
    parts.push(
      `<p style="margin:20px 0 0;padding:14px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:12px;font-size:14px;line-height:1.55;color:#991b1b">Your score moved from <strong>${input.previousScore}</strong> to <strong>${input.score}</strong>. Review the gaps below and update on-site content or entity signals before competitors widen the lead.</p>`,
    );
  }

  if (gaps.length > 0) {
    parts.push(
      emailSectionTitle("Top gaps to fix"),
      emailBulletList(gaps, primaryColor),
    );
  }

  parts.push(
    emailSectionTitle("What to do next"),
    emailTagRow(["Review money prompts", "Fix on-page gaps", "Share proof report"]),
    `<p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#64748b">Your GEO audit for <strong style="color:#0f172a">${escapeHtml(input.domain)}</strong> is ready in CitePilot — open the dashboard for prompt-level citations, competitor share of voice, and a client-ready proof PDF.</p>`,
  );

  return parts.join("");
}

function buildPlainText(input: AuditCompleteEmailInput): string {
  const lines = [
    input.variant === "score_drop"
      ? `Score alert — ${input.domain}`
      : `GEO audit complete — ${input.domain}`,
    "",
    `Citation score: ${input.score}/100`,
    `Prompts cited: ${input.cited}/${input.total}`,
  ];

  if (input.previousScore != null) {
    const delta = input.score - input.previousScore;
    lines.push(`Change vs last audit: ${delta >= 0 ? "+" : ""}${delta}`);
  }

  const gaps = input.gaps.slice(0, 5);
  if (gaps.length > 0) {
    lines.push("", "Top gaps:");
    gaps.forEach((gap, i) => lines.push(`${i + 1}. ${gap}`));
  }

  lines.push("", `Open dashboard: ${dashboardUrl("/dashboard/geo-audit")}`);
  lines.push(`Proof report: ${dashboardUrl("/report/proof")}`);

  return lines.join("\n");
}

export function auditCompleteSubject(input: AuditCompleteEmailInput): string {
  if (input.variant === "score_drop") {
    return `Citation score dropped for ${input.domain} (${input.score}/100)`;
  }
  return `GEO audit complete — ${input.domain} scored ${input.score}/100`;
}

export function buildAuditCompleteEmail(input: AuditCompleteEmailInput): {
  html: string;
  text: string;
  subject: string;
} {
  const primaryColor = "#0ea5e9";
  const bodyHtml = buildBodyHtml(input, primaryColor);
  const isDrop = input.variant === "score_drop";

  const preheader = isDrop
    ? `${input.domain} dropped to ${input.score}/100 — ${input.gaps[0] ?? "review gaps in CitePilot"}`
    : `${input.domain}: ${input.score}/100 · ${input.cited}/${input.total} prompts cited`;

  return {
    subject: auditCompleteSubject(input),
    text: buildPlainText(input),
    html: buildEmailShell({
      preheader,
      title: isDrop ? `Score alert — ${input.domain}` : `Audit complete — ${input.domain}`,
      headerEyebrow: isDrop ? "Citation score alert" : "GEO audit complete",
      bodyHtml,
      primaryColor,
      logoUrl: siteLogoUrl(),
      logoAlt: site.name,
      cta: {
        href: dashboardUrl("/dashboard/geo-audit"),
        label: "Open audit results",
      },
      secondaryCta: {
        href: dashboardUrl("/report/proof"),
        label: "View proof report",
      },
    }),
  };
}
