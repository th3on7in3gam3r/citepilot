export type SiteDetailsSectionId =
  | "domain-info"
  | "pages"
  | "google-data"
  | "targeting"
  | "working-files"
  | "cms"
  | "generate";

export type SiteDetailsSection = {
  id: SiteDetailsSectionId;
  label: string;
  icon: "domain" | "pages" | "google" | "target" | "keywords" | "files" | "cms" | "generate";
  description: string;
};

export type ContentStudioNavGroup = {
  label: string;
  sectionIds: SiteDetailsSectionId[];
};

/** Grouped subnav for Content Studio v2 — create, publish, setup. */
export const CONTENT_STUDIO_NAV_GROUPS: ContentStudioNavGroup[] = [
  {
    label: "Create",
    sectionIds: ["generate", "working-files", "pages"],
  },
  {
    label: "Publish",
    sectionIds: ["cms"],
  },
  {
    label: "Setup",
    sectionIds: ["domain-info", "targeting", "google-data"],
  },
];

const SECTION_BY_ID: Record<SiteDetailsSectionId, SiteDetailsSection> = {
  generate: {
    id: "generate",
    label: "Generate",
    icon: "generate",
    description: "Create branded GEO articles from audit gaps and Optimizer briefs",
  },
  "working-files": {
    id: "working-files",
    label: "Article queue",
    icon: "files",
    description: "Review drafts, publish to CMS, and manage your blog queue",
  },
  pages: {
    id: "pages",
    label: "Content calendar",
    icon: "pages",
    description: "30-day editorial plan ranked by citation gap impact",
  },
  cms: {
    id: "cms",
    label: "CMS & publish",
    icon: "cms",
    description: "Connect Webflow, WordPress, Ghost, Shopify, or Framer",
  },
  "domain-info": {
    id: "domain-info",
    label: "Site profile",
    icon: "domain",
    description: "Domain, description, and business profile for generation",
  },
  targeting: {
    id: "targeting",
    label: "Audiences & prompts",
    icon: "target",
    description: "Buyer-intent audiences and money prompts to target",
  },
  "google-data": {
    id: "google-data",
    label: "Google integrations",
    icon: "google",
    description: "Google Analytics and Search Console for richer briefs",
  },
};

/** Flat section list — order follows Content Studio nav groups. */
export const SITE_DETAILS_SECTIONS: SiteDetailsSection[] =
  CONTENT_STUDIO_NAV_GROUPS.flatMap((group) =>
    group.sectionIds.map((id) => SECTION_BY_ID[id]),
  );

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
