import "server-only";
import { resolveTxt } from "dns/promises";
import { normalizeDomain } from "@/lib/audit/site-analyzer";
import {
  VERIFICATION_DNS_PREFIX,
  VERIFICATION_META_NAME,
} from "@/lib/score/verification-constants";

export async function verifyDnsTxtRecord(
  domain: string,
  token: string,
): Promise<boolean> {
  const normalized = normalizeDomain(domain);
  if (!normalized) return false;

  const expected = `${VERIFICATION_DNS_PREFIX}${token}`;
  const hosts = [normalized, `_citepilot-verify.${normalized}`];

  for (const host of hosts) {
    try {
      const records = await resolveTxt(host);
      const flat = records.flat().join("");
      if (flat.includes(expected)) return true;
    } catch {
      // Host has no TXT records — try next
    }
  }
  return false;
}

export async function verifyMetaTag(
  domain: string,
  token: string,
): Promise<boolean> {
  const normalized = normalizeDomain(domain);
  if (!normalized) return false;

  const urls = [`https://${normalized}`, `https://www.${normalized}`];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(8000),
        headers: { "User-Agent": "CitePilot-Verification/1.0" },
      });
      if (!res.ok) continue;
      const html = await res.text();
      const pattern = new RegExp(
        `<meta[^>]+name=["']${VERIFICATION_META_NAME}["'][^>]+content=["']${token}["']`,
        "i",
      );
      const patternAlt = new RegExp(
        `<meta[^>]+content=["']${token}["'][^>]+name=["']${VERIFICATION_META_NAME}["']`,
        "i",
      );
      if (pattern.test(html) || patternAlt.test(html)) return true;
    } catch {
      // Try alternate URL
    }
  }
  return false;
}
