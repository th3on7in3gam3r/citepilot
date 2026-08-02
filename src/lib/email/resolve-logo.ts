import { getStoredLogo } from "@/lib/white-label/logo-store";
import { appBaseUrl } from "@/lib/stripe/config";

function absoluteAssetUrl(pathOrUrl: string): string {
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  const base = appBaseUrl().replace(/\/$/, "");
  return `${base}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

/** Public logo URL for email `<img>` tags — keeps HTML small (Gmail clips at ~102KB). */
export function hostedWhiteLabelLogoUrl(workspaceId: string): string {
  const base = appBaseUrl().replace(/\/$/, "");
  return `${base}/api/white-label/logo?workspaceId=${encodeURIComponent(workspaceId)}`;
}

/** Email-safe logo src — never inline base64 (Gmail clips the message). */
export async function resolveEmailLogoSrc(input: {
  workspaceId?: string;
  logoUrl?: string;
}): Promise<string | undefined> {
  const explicit = input.logoUrl?.trim();

  if (explicit && !explicit.includes("/api/white-label/logo")) {
    const absolute = absoluteAssetUrl(explicit);
    if (absolute.startsWith("data:")) return undefined;
    return absolute || undefined;
  }

  if (!input.workspaceId) return undefined;

  const stored = await getStoredLogo(input.workspaceId);
  if (!stored) return undefined;

  // PNG/JPEG hosted URLs render in Gmail; SVG is blocked in many clients.
  if (stored.mimeType === "image/svg+xml") {
    return undefined;
  }

  return hostedWhiteLabelLogoUrl(input.workspaceId);
}

export function agencyDisplayName(agencyName: string, domain: string): string {
  const trimmed = agencyName.trim();
  if (trimmed) return trimmed;
  const slug = domain.split(".")[0]?.trim();
  if (slug && slug.length > 1) {
    return slug.charAt(0).toUpperCase() + slug.slice(1);
  }
  return "Your agency";
}
