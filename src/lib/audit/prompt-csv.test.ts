import { describe, expect, it } from "vitest";
import { parsePromptCsv } from "@/lib/audit/prompt-csv";

describe("parsePromptCsv", () => {
  it("parses single-column lines", () => {
    expect(parsePromptCsv("best crm\nalternatives to hubspot")).toEqual([
      "best crm",
      "alternatives to hubspot",
    ]);
  });

  it("parses prompt header column", () => {
    const csv = "prompt,notes\nbest crm,high intent\npricing software,";
    expect(parsePromptCsv(csv)).toEqual(["best crm", "pricing software"]);
  });

  it("deduplicates prompts", () => {
    expect(parsePromptCsv("best crm\nbest crm")).toEqual(["best crm"]);
  });
});
