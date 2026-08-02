import { describe, expect, it } from "vitest";
import {
  applyPromptLimit,
  buildPromptLimits,
  coalescePromptLimitMax,
  promptLimitUpgradeError,
  promptMaxForPlan,
} from "@/lib/billing/prompt-limits";
import { PROMPT_LIMIT_FREE } from "@/lib/billing/limits";

describe("prompt limits", () => {
  it("caps free prompts at 10", () => {
    const prompts = Array.from({ length: 15 }, (_, i) => `prompt ${i}`);
    const result = applyPromptLimit(prompts, "free");
    expect(result.prompts).toHaveLength(10);
    expect(result.trimmed).toBe(true);
  });

  it("allows unlimited fleet prompts", () => {
    const prompts = Array.from({ length: 50 }, (_, i) => `prompt ${i}`);
    const result = applyPromptLimit(prompts, "fleet");
    expect(result.prompts).toHaveLength(50);
    expect(result.max).toBeNull();
  });

  it("builds canAdd from plan max", () => {
    expect(buildPromptLimits("pilot", 24).canAdd).toBe(true);
    expect(buildPromptLimits("pilot", 25).canAdd).toBe(false);
    expect(promptMaxForPlan("fleet")).toBeNull();
  });

  it("coalescePromptLimitMax keeps Fleet null unlimited", () => {
    expect(coalescePromptLimitMax(undefined)).toBe(PROMPT_LIMIT_FREE);
    expect(coalescePromptLimitMax(null)).toBeNull();
    expect(coalescePromptLimitMax(25)).toBe(25);
    expect(coalescePromptLimitMax(10)).toBe(10);
  });

  it("promptLimitUpgradeError never implies a Fleet cap", () => {
    expect(
      promptLimitUpgradeError(buildPromptLimits("fleet", 100)),
    ).toContain("refresh and try again");
    expect(
      promptLimitUpgradeError(buildPromptLimits("fleet", 100)),
    ).not.toMatch(/Prompt limit reached/i);
  });
});
