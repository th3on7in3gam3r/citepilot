import { describe, expect, it } from "vitest";
import {
  clampMoneyScore,
  normalizeIntent,
  parseGeneratedPromptsJson,
} from "@/lib/money-prompts/generate";
import {
  diagnoseGapReason,
  isBrandCited,
  suggestFix,
} from "@/lib/money-prompts/analyze-gap";

describe("money-prompts generate helpers", () => {
  it("clamps money scores to 0-100", () => {
    expect(clampMoneyScore(-5)).toBe(0);
    expect(clampMoneyScore(150)).toBe(100);
    expect(clampMoneyScore(72.4)).toBe(72);
    expect(clampMoneyScore(Number.NaN)).toBe(0);
  });

  it("normalizes intent strings", () => {
    expect(normalizeIntent("best-of")).toBe("best-of");
    expect(normalizeIntent("COMPARISON")).toBe("comparison");
    expect(normalizeIntent("best tools")).toBe("best-of");
    expect(normalizeIntent("near me dentist")).toBe("near-me");
    expect(normalizeIntent("how to buy")).toBe("how-to-buy");
    expect(normalizeIntent("weird")).toBe("transactional");
  });

  it("parses model JSON with snake_case fields", () => {
    const prompts = parseGeneratedPromptsJson(
      JSON.stringify({
        prompts: [
          {
            query: "best crm",
            intent: "best-of",
            prompt_text: "What is the best CRM for solo founders in 2026?",
            money_score: 88,
          },
        ],
      }),
    );
    expect(prompts).toHaveLength(1);
    expect(prompts[0]?.promptText).toContain("CRM");
    expect(prompts[0]?.moneyScore).toBe(88);
    expect(prompts[0]?.intent).toBe("best-of");
  });

  it("parses fenced JSON", () => {
    const prompts = parseGeneratedPromptsJson(`\`\`\`json
{"prompts":[{"query":"q","intent":"review","promptText":"Honest reviews of project tools","moneyScore":55}]}
\`\`\``);
    expect(prompts[0]?.intent).toBe("review");
    expect(prompts[0]?.moneyScore).toBe(55);
  });
});

describe("money-prompts gap heuristics", () => {
  it("detects brand domain in sources", () => {
    expect(
      isBrandCited("getcitepilot.com", [
        { link: "https://www.getcitepilot.com/blog/geo" },
      ]),
    ).toBe(true);
    expect(
      isBrandCited("getcitepilot.com", [
        { url: "https://competitor.com/page", snippet: "other brands" },
      ]),
    ).toBe(false);
  });

  it("diagnoses gap reasons", () => {
    expect(diagnoseGapReason([])).toBe("thin-authority");
    expect(
      diagnoseGapReason([
        {
          name: "Alt",
          url: "https://example.com/citepilot-vs-other",
          snippet: "",
        },
      ]),
    ).toBe("no-comparison-page");
    expect(
      diagnoseGapReason([
        { name: "Guide", url: "https://example.com/guide", snippet: "" },
      ]),
    ).toBe("no-content");
  });

  it("suggests fixes for gap reasons", () => {
    const brand = {
      id: "w1",
      userId: "u1",
      name: "CitePilot",
      domain: "getcitepilot.com",
    };
    expect(suggestFix("no-content", brand, "best geo tools")).toContain(
      "best geo tools",
    );
    expect(suggestFix("no-comparison-page", brand, "q")).toContain("CitePilot vs");
  });
});
