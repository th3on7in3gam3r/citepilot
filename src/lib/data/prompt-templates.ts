export type PromptTemplateCategory = {
  id: string;
  label: string;
  description: string;
  prompts: string[];
};

export const PROMPT_TEMPLATE_CATEGORIES: PromptTemplateCategory[] = [
  {
    id: "b2b-saas",
    label: "B2B SaaS",
    description: "Software buyer-intent prompts for category and competitor searches.",
    prompts: [
      "best CRM software for startups",
      "best project management tools for remote teams",
      "top analytics platforms for B2B SaaS",
      "best customer success software",
      "alternatives to Salesforce for SMB",
      "best marketing automation for SaaS",
      "top help desk software for startups",
      "best billing software for subscription businesses",
      "alternatives to HubSpot for B2B",
      "best SEO tools for SaaS companies",
      "top email marketing platforms for B2B",
      "best onboarding software for SaaS",
      "alternatives to Intercom for support",
      "best product analytics tools",
      "top revenue intelligence platforms",
      "best contract management software",
      "alternatives to Zendesk for startups",
      "best ABM platforms for B2B",
      "top sales engagement tools",
      "best data enrichment tools for sales teams",
    ],
  },
  {
    id: "agency",
    label: "Agency",
    description: "Prompts agencies use to track visibility in buyer research.",
    prompts: [
      "top marketing agencies for startups",
      "best SEO agencies for B2B companies",
      "best digital marketing agencies for SaaS",
      "top content marketing agencies",
      "best PPC agencies for ecommerce",
      "top branding agencies for tech companies",
      "best web design agencies for startups",
      "top growth marketing agencies",
      "best link building agencies",
      "best PR agencies for B2B SaaS",
      "top social media agencies for brands",
      "best conversion rate optimization agencies",
      "top demand generation agencies",
      "best creative agencies for tech",
      "top performance marketing agencies",
    ],
  },
  {
    id: "ecommerce",
    label: "Ecommerce",
    description: "Product and brand discovery prompts for retail and DTC.",
    prompts: [
      "best sustainable fashion brands",
      "top skincare brands for sensitive skin",
      "best running shoe brands for marathon training",
      "top home fitness equipment brands",
      "best organic coffee brands online",
      "top pet food brands for dogs",
      "best minimalist wallet brands",
      "top outdoor gear brands for hiking",
      "best mattress brands for side sleepers",
      "top clean beauty brands",
      "best wireless earbuds brands",
      "top meal kit delivery brands",
      "best baby stroller brands",
      "top supplement brands for athletes",
      "best luggage brands for travel",
    ],
  },
];

export function getPromptTemplateCategory(id: string): PromptTemplateCategory | undefined {
  return PROMPT_TEMPLATE_CATEGORIES.find((c) => c.id === id);
}
