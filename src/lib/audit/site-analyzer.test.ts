import { describe, expect, it } from "vitest";
import { promptOverlap } from "@/lib/audit/site-analyzer";

describe("audit prompt signals", () => {
  it("scores higher overlap when prompt terms appear in corpus", () => {
    const corpus = "CitePilot is the best CRM for agencies under 50 seats";
    const high = promptOverlap("best CRM for agencies", corpus);
    const low = promptOverlap("enterprise data warehouse", corpus);
    expect(high).toBeGreaterThan(low);
  });
});
