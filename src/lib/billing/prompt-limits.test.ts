import { describe, expect, it } from "vitest";
import {
  applyPromptLimit,
  buildPromptLimits,
  promptMaxForPlan,
} from "@/lib/billing/prompt-limits";

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
});
