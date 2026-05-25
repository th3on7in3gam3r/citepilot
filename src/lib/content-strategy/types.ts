export type AudienceSegment =
  | "growth-marketing"
  | "solo-founder"
  | "agency"
  | "ecommerce"
  | "saas";

export type ContentType = "pillar" | "tutorial" | "comparison" | "news";

export type EditorialPillarId =
  | "seo-automation"
  | "geo"
  | "technical-seo"
  | "local-seo"
  | "paid-organic"
  | "agency-growth";

export type ArticleBriefInput = {
  topic: string;
  audience: AudienceSegment;
  contentType: ContentType;
  angle?: string;
};

export type ArticleBrief = {
  topic: string;
  audience: AudienceSegment;
  contentType: ContentType;
  primaryKeyword: string;
  semanticKeywords: string[];
  searchIntent: string;
  suggestedTitle: string;
  metaTitle: string;
  metaDescription: string;
  outline: { heading: string; bullets: string[] }[];
  faqPrompts: string[];
  schemaTypes: string[];
  internalLinkTopics: string[];
  geoNotes: string[];
};

export type GeneratedArticleRequest = ArticleBriefInput & {
  wordTarget?: number;
  pillar?: EditorialPillarId;
  workspaceId?: string;
  publish?: boolean;
};
