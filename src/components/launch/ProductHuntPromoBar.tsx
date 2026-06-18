"use client";

import { useEffect, useState } from "react";
import { PH_PROMO_CODE, PH_PROMO_LABEL } from "@/lib/launch/config";
import { PH_PROMO_COOKIE } from "@/lib/launch/utm";

function readPromoCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${PH_PROMO_COOKIE}=([^;]*)`));
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]).trim().toUpperCase();
  } catch {
    return null;
  }
}

export function ProductHuntPromoBar() {
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [validated, setValidated] = useState<string | null>(null);

  useEffect(() => {
    const code = readPromoCookie();
    if (!code) return;
    setPromoCode(code);

    void fetch(`/api/billing/validate-promo?code=${encodeURIComponent(code)}`)
      .then((res) => res.json())
      .then((data: { valid?: boolean; message?: string }) => {
        if (data.valid && data.message) setValidated(data.message);
      })
      .catch(() => {
        if (code === PH_PROMO_CODE) {
          setValidated(`✓ ${PH_PROMO_CODE} applied — 30% off for 3 months`);
        }
      });
  }, []);

  if (!promoCode) return null;

  return (
    <div
      role="status"
      className="mx-auto mb-8 max-w-3xl rounded-xl border border-amber-300/60 bg-gradient-to-r from-amber-50 to-amber-100/80 px-4 py-3 text-center text-sm text-amber-950"
    >
      <p className="font-semibold">
        {validated ?? `Product Hunt offer: ${PH_PROMO_LABEL}`}
      </p>
      <p className="mt-0.5 text-xs text-amber-900/80">
        Code <code className="font-bold">{promoCode}</code> applies at Pilot checkout (monthly).
      </p>
    </div>
  );
}

export function readStoredPromoCode(): string | null {
  return readPromoCookie();
}
