import { describe, expect, it } from "vitest";
import {
  buildBaselinePlan,
  parseClaudeOptimizerPlan,
} from "@/lib/optimizer/parse-plan";

describe("optimizer parse-plan", () => {
  it("builds baseline fixes from audit gaps", () => {
    const plan = buildBaselinePlan({
      domain: "example.com",
      gaps: ["Missing FAQPage schema", "robots.txt may block crawlers"],
    });
    expect(plan.fixes.length).toBe(2);
    expect(plan.aiGenerated).toBe(false);
    expect(plan.fixes.some((f) => f.category === "robots")).toBe(true);
  });

  it("parses Claude JSON into a plan", () => {
    const fallback = buildBaselinePlan({ domain: "example.com", gaps: [] });
    const text = JSON.stringify({
      summary: "Fix schema first.",
      fixes: [
        {
          id: "faq",
          category: "aeo",
          priority: 1,
          title: "Add FAQ schema",
          problem: "No FAQ schema detected",
          deliverableType: "code",
          code: "<script>{}</script>",
          placement: "site-head",
        },
      ],
    });
    const plan = parseClaudeOptimizerPlan(text, fallback);
    expect(plan.aiGenerated).toBe(true);
    expect(plan.fixes[0]?.title).toBe("Add FAQ schema");
  });
});
