import { pricingTiers } from "@/lib/content";
import { absoluteUrl } from "@/lib/schema/urls";

export type SchemaOffer = {
  "@type": "Offer";
  "@id": string;
  name: string;
  description: string;
  price: string;
  priceCurrency: "USD";
  url: string;
  priceSpecification?: {
    "@type": "UnitPriceSpecification";
    price: string;
    priceCurrency: "USD";
    unitText: "MONTH";
  };
};

/** Map public pricing tiers to schema.org Offer nodes (no ratings). */
export function pricingTierOffers(pricingPageUrl: string): SchemaOffer[] {
  return pricingTiers.map((tier) => {
    const slug = tier.name.toLowerCase().replace(/\s+/g, "-");
    const price =
      tier.price === "Free" ? "0" : tier.price.replace(/[$,]/g, "");
    const offer: SchemaOffer = {
      "@type": "Offer",
      "@id": `${pricingPageUrl}#offer-${slug}`,
      name: tier.name,
      description: tier.description,
      price,
      priceCurrency: "USD",
      url: absoluteUrl(tier.href),
    };
    if (tier.period === "/mo") {
      offer.priceSpecification = {
        "@type": "UnitPriceSpecification",
        price,
        priceCurrency: "USD",
        unitText: "MONTH",
      };
    }
    return offer;
  });
}

export function pricingOfferPrices(): string[] {
  return pricingTiers.map((tier) =>
    tier.price === "Free" ? "0" : tier.price.replace(/[$,]/g, ""),
  );
}
