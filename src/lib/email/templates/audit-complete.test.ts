import { describe, expect, it } from "vitest";
import { buildAuditCompleteEmail } from "@/lib/email/templates/audit-complete";

describe("buildAuditCompleteEmail", () => {
  it("renders branded audit complete HTML with score, gaps, and CTAs", () => {
    const { html, text, subject } = buildAuditCompleteEmail({
      domain: "aegis-loop.com",
      score: 45,
      cited: 0,
      total: 15,
      gaps: [
        "robots.txt may block crawlers — verify AI bot access",
        "On-site content doesn't support prompt: SaaS subscriptions",
      ],
      previousScore: 52,
    });

    expect(subject).toBe("GEO audit complete — aegis-loop.com scored 45/100");
    expect(html).toContain("Citation score");
    expect(html).toContain("45");
    expect(html).toContain("▼ -7");
    expect(html).toContain("0/15 prompts cited");
    expect(html).toContain("robots.txt may block crawlers");
    expect(html).toContain("Open audit results");
    expect(html).toContain("View proof report");
    expect(html).toContain("getcitepilot.com");
    expect(text).toContain("Top gaps:");
    expect(text).toContain("1. robots.txt may block crawlers");
  });

  it("renders score drop variant with alert styling", () => {
    const { html, subject } = buildAuditCompleteEmail({
      domain: "example.com",
      score: 40,
      cited: 2,
      total: 10,
      gaps: ["Missing FAQ schema"],
      previousScore: 55,
      variant: "score_drop",
    });

    expect(subject).toContain("Citation score dropped");
    expect(html).toContain("Score alert");
    expect(html).toContain("moved from");
  });
});
