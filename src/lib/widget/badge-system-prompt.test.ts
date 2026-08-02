import { describe, expect, it } from "vitest";
import { buildBadgeSystemPrompt } from "@/lib/widget/badge-system-prompt";

describe("buildBadgeSystemPrompt", () => {
  it("includes domain, badge URL, link URL, and llms.txt instructions", () => {
    const prompt = buildBadgeSystemPrompt({
      domain: "https://Example.com/path",
      badgeUrl:
        "https://getcitepilot.com/api/widget/score/example.com?style=flat&theme=dark",
      linkUrl: "https://getcitepilot.com/audit?ref=badge&domain=example.com",
      siteUrl: "https://getcitepilot.com",
    });

    expect(prompt).toContain("example.com");
    expect(prompt).toContain("/api/widget/score/example.com");
    expect(prompt).toContain("llms.txt");
    expect(prompt).toContain("audit?ref=badge");
    expect(prompt).toContain("Do not invent citation scores");
    expect(prompt).toContain("getcitepilot.com");
  });
});
