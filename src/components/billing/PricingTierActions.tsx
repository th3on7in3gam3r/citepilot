"use client";

import { useEffect, useState } from "react";
import { PilotCheckoutButton } from "@/components/billing/PilotCheckoutButton";
import { ProductCTA } from "@/components/ui/ProductCTA";
import type { BillingInterval } from "@/lib/billing/types";
import { authClient } from "@/lib/auth/client";

export function PricingTierActions({
  tierName,
  href,
  cta,
  variant,
  billingInterval = "monthly",
  abVariant,
}: {
  tierName: string;
  href: string;
  cta: string;
  variant: "accent" | "primary" | "dark";
  billingInterval?: BillingInterval;
  abVariant?: string;
}) {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authClient
      .getSession()
      .then(({ data }) => {
        if (!cancelled) setSignedIn(Boolean(data?.session));
      })
      .catch(() => {
        if (!cancelled) setSignedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (tierName === "Pilot") {
    return (
      <PilotCheckoutButton
        variant={variant}
        className="w-full"
        signedIn={signedIn}
        plan="pilot"
        billingInterval={billingInterval}
        source="pricing_page"
        abVariant={abVariant}
      >
        {signedIn ? "Subscribe to Pilot" : "Sign in to subscribe"}
      </PilotCheckoutButton>
    );
  }

  if (tierName === "Fleet") {
    return (
      <PilotCheckoutButton
        variant={variant}
        className="w-full"
        signedIn={signedIn}
        plan="fleet"
        billingInterval={billingInterval}
        source="pricing_page"
        abVariant={abVariant}
      >
        {signedIn ? "Subscribe to Fleet" : "Sign in to subscribe"}
      </PilotCheckoutButton>
    );
  }

  return (
    <ProductCTA href={href} variant={variant} className="w-full" showArrow>
      {cta}
    </ProductCTA>
  );
}
