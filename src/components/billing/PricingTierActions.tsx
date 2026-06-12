"use client";

import { useEffect, useState } from "react";
import { PilotCheckoutButton } from "@/components/billing/PilotCheckoutButton";
import { ProductCTA } from "@/components/ui/ProductCTA";
import { authClient } from "@/lib/auth/client";

export function PricingTierActions({
  tierName,
  href,
  cta,
  variant,
}: {
  tierName: string;
  href: string;
  cta: string;
  variant: "accent" | "primary" | "dark";
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
      <PilotCheckoutButton variant={variant} className="w-full" signedIn={signedIn} plan="pilot">
        {signedIn ? "Subscribe to Pilot" : "Sign in to subscribe"}
      </PilotCheckoutButton>
    );
  }

  if (tierName === "Fleet") {
    return (
      <PilotCheckoutButton variant={variant} className="w-full" signedIn={signedIn} plan="fleet">
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
