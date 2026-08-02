import { describe, expect, it } from "vitest";
import {
  pricingOfferPrices,
  pricingTierOffers,
} from "@/lib/schema/pricing-offers";

describe("pricingTierOffers", () => {
  it("maps Free / Pilot / Fleet to schema prices 0 / 79 / 249", () => {
    expect(pricingOfferPrices()).toEqual(["0", "79", "249"]);
  });

  it("builds Offer nodes with monthly priceSpecification for paid tiers", () => {
    const offers = pricingTierOffers("https://getcitepilot.com/pricing");
    expect(offers).toHaveLength(3);
    expect(offers[0]).toMatchObject({
      "@type": "Offer",
      name: "Audit",
      price: "0",
      priceCurrency: "USD",
    });
    expect(offers[0].priceSpecification).toBeUndefined();
    expect(offers[1]).toMatchObject({
      name: "Pilot",
      price: "79",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "79",
        unitText: "MONTH",
      },
    });
    expect(offers[2]).toMatchObject({
      name: "Fleet",
      price: "249",
      priceSpecification: {
        price: "249",
        unitText: "MONTH",
      },
    });
  });
});
