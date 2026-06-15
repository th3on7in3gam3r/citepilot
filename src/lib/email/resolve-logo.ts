import { getStoredLogo } from "@/lib/white-label/logo-store";
import { appBaseUrl } from "@/lib/stripe/config";

function absoluteAssetUrl(pathOrUrl: string): string {
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  const base = appBaseUrl().replace(/\/$/, "");
  return `${base}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

function dataUriFromStoredLogo(mimeType: string, buffer: Buffer): string {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

/** Email-safe logo src — never returns API routes that 404 without a stored asset. */
export async function resolveEmailLogoSrc(input: {
  workspaceId?: string;
  logoUrl?: string;
}): Promise<string | undefined> {
  const explicit = input.logoUrl?.trim();

  if (explicit && !explicit.includes("/api/white-label/logo")) {
    const absolute = absoluteAssetUrl(explicit);
    return absolute || undefined;
  }

  if (!input.workspaceId) return undefined;

  const stored = await getStoredLogo(input.workspaceId);
  if (!stored) return undefined;

  // PNG/JPEG data URIs render reliably in Gmail; SVG is blocked in many clients.
  if (stored.mimeType === "image/svg+xml") {
    return undefined;
  }

  return dataUriFromStoredLogo(stored.mimeType, stored.buffer);
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
