import { describe, expect, it } from "vitest";
import { classifyGapFixType } from "./templates";

describe("classifyGapFixType", () => {
  it("detects schema gaps", () => {
    expect(classifyGapFixType("Missing FAQPage schema")).toBe("schema");
  });

  it("detects content gaps", () => {
    expect(classifyGapFixType("Thin homepage content")).toBe("content");
  });

  it("defaults to entity", () => {
    expect(classifyGapFixType("Weak brand entity recognition")).toBe("entity");
  });
});
