export type OptimizerCategory = "seo" | "aeo" | "llm" | "robots" | "prompt";

export type OptimizerDeliverableType = "code" | "prompt";

export type OptimizerFix = {
  id: string;
  category: OptimizerCategory;
  priority: number;
  title: string;
  problem: string;
  deliverableType: OptimizerDeliverableType;
  code?: string;
  prompt?: string;
  placement: string;
  relatedGap?: string;
  source: "baseline" | "ai";
};

export type OptimizerPlan = {
  summary: string;
  fixes: OptimizerFix[];
  aiGenerated: boolean;
  generatedAt: string;
};
