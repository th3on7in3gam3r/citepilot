export type SiteDetailsSectionId =
  | "domain-info"
  | "pages"
  | "google-data"
  | "targeting"
  | "competitors"
  | "keywords"
  | "working-files"
  | "cms"
  | "generate";

export type SiteDetailsSection = {
  id: SiteDetailsSectionId;
  label: string;
  icon: "domain" | "pages" | "google" | "target" | "competitors" | "keywords" | "files" | "cms" | "generate";
  description: string;
};

export const SITE_DETAILS_SECTIONS: SiteDetailsSection[] = [
  {
    id: "domain-info",
    label: "Domain Info",
    icon: "domain",
    description: "Short page description text",
  },
  {
    id: "pages",
    label: "Pages",
    icon: "pages",
    description: "30-day editorial calendar and content plan",
  },
  {
    id: "google-data",
    label: "Google Data",
    icon: "google",
    description: "Short page description text",
  },
  {
    id: "targeting",
    label: "Targeting",
    icon: "target",
    description: "Audiences and buyer-intent prompts",
  },
  {
    id: "competitors",
    label: "Competitors",
    icon: "competitors",
    description: "Brands you lose citations to on AI prompts",
  },
  {
    id: "keywords",
    label: "Keywords",
    icon: "keywords",
    description: "Short page description text",
  },
  {
    id: "working-files",
    label: "Working Files",
    icon: "files",
    description: "Generated articles and draft queue",
  },
  {
    id: "generate",
    label: "Generate",
    icon: "generate",
    description: "Create branded GEO articles from gaps",
  },
  {
    id: "cms",
    label: "CMS Settings",
    icon: "cms",
    description: "Publishing connections and field mapping",
  },
];

export const SITE_MODEL_OPTIONS = [
  { id: "single-location", label: "Single location business", businessType: "local" },
  {
    id: "multi-single",
    label: "Multiple location business · Single-Service",
    businessType: "local",
  },
  {
    id: "multi-multi",
    label: "Multiple location business · Multiple-Service",
    businessType: "agency",
  },
  { id: "affiliate", label: "Affiliate Marketing", businessType: "other" },
] as const;

export const INDUSTRY_OPTIONS = [
  { id: "saas", label: "B2B SaaS" },
  { id: "agency", label: "Agency / Marketing" },
  { id: "ecommerce", label: "Ecommerce" },
  { id: "healthcare", label: "Healthcare" },
  { id: "local", label: "Local business" },
  { id: "creator", label: "Creator / Media" },
  { id: "other", label: "Other" },
] as const;
