import type { WhiteLabelPreferences } from "@/lib/settings";
import { dashboardUrl } from "@/lib/email/config";
import { appBaseUrl } from "@/lib/stripe/config";
import {
  brandingFromPreferences,
  logoSrcForWorkspace,
  normalizePrimaryColor,
  poweredByFooterLines,
} from "@/lib/white-label/theme";

function absoluteAssetUrl(pathOrUrl: string): string {
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  const base = appBaseUrl().replace(/\/$/, "");
  return `${base}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

export type WhiteLabelEmailOptions = {
  whiteLabel: WhiteLabelPreferences;
  workspaceId?: string;
  title: string;
  bodyHtml: string;
  unsubscribeUrl?: string;
};

export function buildWhiteLabelEmailHtml(input: WhiteLabelEmailOptions): string {
  const branding = brandingFromPreferences(input.whiteLabel);
  const primary = normalizePrimaryColor(branding.primaryColor);
  const agency = branding.agencyName.trim() || "Your agency";
  const footer = poweredByFooterLines(branding);
  const logoUrl = absoluteAssetUrl(
    branding.logoUrl.trim() ||
      (input.workspaceId ? logoSrcForWorkspace(input.workspaceId, "") : ""),
  );

  const logoBlock = logoUrl
    ? `<img src="${logoUrl}" alt="${agency}" height="36" style="max-width:200px;height:36px;object-fit:contain" />`
    : `<p style="margin:0;font-size:18px;font-weight:700;color:#111">${agency}</p>`;

  const unsubscribe = input.unsubscribeUrl
    ? `<p style="margin-top:16px;font-size:11px;color:#888"><a href="${input.unsubscribeUrl}" style="color:#888">Unsubscribe</a></p>`
    : "";

  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:560px;margin:0 auto;padding:24px;background:#fafafa">
<div style="background:#fff;border-radius:12px;padding:24px;border-top:4px solid ${primary}">
${logoBlock}
<h1 style="font-size:20px;margin:20px 0 16px;color:#111">${input.title}</h1>
${input.bodyHtml}
<p style="margin-top:32px;font-size:12px;color:#666"><a href="${dashboardUrl("/dashboard/analytics")}" style="color:${primary}">Open analytics dashboard</a></p>
<hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
<p style="margin:0;font-size:12px;color:#666">${footer.primary}</p>
${footer.secondary ? `<p style="margin:4px 0 0;font-size:10px;color:#999">${footer.secondary}</p>` : ""}
${input.whiteLabel.replyToEmail.trim() ? `<p style="margin-top:8px;font-size:11px;color:#888">Reply to this digest: ${input.whiteLabel.replyToEmail.trim()}</p>` : ""}
${unsubscribe}
</div>
</body></html>`;
}

export function whiteLabelFromName(whiteLabel: WhiteLabelPreferences): string | undefined {
  const name = whiteLabel.emailFromName.trim() || whiteLabel.agencyName.trim();
  return name || undefined;
}
