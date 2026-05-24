"use client";

import { useEffect, useState } from "react";
import { PilotCheckoutButton } from "@/components/billing/PilotCheckoutButton";
import { ProductCTA } from "@/components/ui/ProductCTA";

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
    void fetch("/api/billing/status", { credentials: "include" })
      .then((r) => setSignedIn(r.ok))
      .catch(() => setSignedIn(false));
  }, []);

  if (tierName === "Pilot") {
    return (
      <PilotCheckoutButton variant={variant} className="w-full" signedIn={signedIn}>
        {signedIn ? "Subscribe to Pilot" : "Sign in to subscribe"}
      </PilotCheckoutButton>
    );
  }

  return (
    <ProductCTA href={href} variant={variant} className="w-full" showArrow>
      {cta}
    </ProductCTA>
  );
}
