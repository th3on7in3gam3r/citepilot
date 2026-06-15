import { faq } from "@/lib/content";
import { answerCapsuleBlocks } from "@/lib/marketing/answer-capsule";

export type FaqItem = { q: string; a: string; id?: string };

/** FAQ items in homepage JSON-LD (answer capsules + content FAQ). */
export function homepageFaqItems(): FaqItem[] {
  return [
    ...answerCapsuleBlocks.map((block) => ({
      id: block.id,
      q: block.question,
      a: block.answer,
    })),
    ...faq.map((item) => ({ q: item.q, a: item.a })),
  ];
}

export const pricingSpecificFaqs: FaqItem[] = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your dashboard settings at any time. No lock-in, no cancellation fees.",
  },
  {
    q: "Is there a free trial for Pilot?",
    a: "The Free tier is a full audit, not a time-limited trial. Upgrade to Pilot when you need weekly monitoring — downgrade anytime.",
  },
];

export function pricingPageFaqItems(): FaqItem[] {
  return [...homepageFaqItems(), ...pricingSpecificFaqs];
}
