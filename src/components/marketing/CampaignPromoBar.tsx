"use client";

import { useEffect, useState } from "react";
import type { CampaignSnapshot } from "@/lib/campaign/config";
import { PH_PROMO_CODE, PH_PROMO_LABEL } from "@/lib/launch/config";
import { PH_ATTRIBUTION_MAX_AGE_SEC, PH_PROMO_COOKIE } from "@/lib/launch/utm";

function readPromoCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${PH_PROMO_COOKIE}=([^;]*)`),
  );
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]).trim().toUpperCase();
  } catch {
    return null;
  }
}

function setPromoCookie(code: string): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${PH_PROMO_COOKIE}=${encodeURIComponent(code)}; Path=/; Max-Age=${PH_ATTRIBUTION_MAX_AGE_SEC}; SameSite=Lax${secure}`;
}

function formatEndsAt(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

type Props = {
  campaign?: CampaignSnapshot | null;
};

/**
 * Env-gated seasonal campaign banner + Product Hunt cookie promo.
 * No countdown / fake scarcity — optional end date only when configured.
 */
export function CampaignPromoBar({ campaign = null }: Props) {
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [validated, setValidated] = useState<string | null>(null);

  useEffect(() => {
    const fromCookie = readPromoCookie();
    const fromCampaign =
      campaign?.active && campaign.code ? campaign.code : null;
    const code = fromCookie ?? fromCampaign;
    if (!code) return;

    if (fromCampaign && !fromCookie) {
      setPromoCookie(fromCampaign);
    }

    setPromoCode(code);

    void fetch(`/api/billing/validate-promo?code=${encodeURIComponent(code)}`)
      .then((res) => res.json())
      .then((data: { valid?: boolean; message?: string }) => {
        if (data.valid && data.message) setValidated(data.message);
      })
      .catch(() => {
        if (code === PH_PROMO_CODE) {
          setValidated(`✓ ${PH_PROMO_CODE} applied — 30% off for 3 months`);
        } else if (campaign?.active && campaign.code === code) {
          setValidated(`✓ ${code} — ${campaign.message}`);
        }
      });
  }, [campaign]);

  const showCampaignOnly = Boolean(campaign?.active && !promoCode);
  if (!promoCode && !showCampaignOnly) return null;

  const endsLabel = formatEndsAt(campaign?.endsAtIso ?? null);
  const headline =
    validated ??
    (campaign?.active
      ? campaign.message
      : `Product Hunt offer: ${PH_PROMO_LABEL}`);

  return (
    <div
      role="status"
      className="mx-auto mb-8 max-w-3xl rounded-xl border border-amber-300/60 bg-gradient-to-r from-amber-50 to-amber-100/80 px-4 py-3 text-center text-sm text-amber-950 dark:border-amber-400/30 dark:from-amber-950/40 dark:to-amber-900/30 dark:text-amber-50"
    >
      <p className="font-semibold">{headline}</p>
      {promoCode ? (
        <p className="mt-0.5 text-xs text-amber-900/80 dark:text-amber-100/70">
          Code <code className="font-bold">{promoCode}</code> applies to Pilot{" "}
          <span className="font-semibold">monthly</span> only — not annual
          (annual already includes Save 20%).
        </p>
      ) : campaign?.active ? (
        <p className="mt-0.5 text-xs text-amber-900/80 dark:text-amber-100/70">
          Promo applies to Pilot <span className="font-semibold">monthly</span>{" "}
          only — not annual (annual already includes Save 20%).
        </p>
      ) : null}
      {campaign?.active && endsLabel ? (
        <p className="mt-0.5 text-xs text-amber-900/80 dark:text-amber-100/70">
          Available until {endsLabel}.
        </p>
      ) : null}
    </div>
  );
}

export function readStoredPromoCode(): string | null {
  return readPromoCookie();
}
