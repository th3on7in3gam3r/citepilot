import { describe, expect, it } from "vitest";
import { getFixActionLabel, getFixForGap } from "@/lib/geo/fixes";

const domain = "acme.com";

describe("getFixForGap", () => {
  it("maps FAQ schema gaps to FAQPage fix", () => {
    const fix = getFixForGap("Missing FAQPage schema — high-impact for AI answer extraction", domain);
    expect(fix.id).toBe("faq-schema");
    expect(fix.title).toContain("FAQPage");
  });

  it("maps meta description gaps without confusing entity summaries", () => {
    const fix = getFixForGap(
      "Missing meta description — AI systems use this for entity summaries",
      domain,
    );
    expect(fix.id).toBe("meta-description");
  });

  it("maps prompt support gaps to prompt-specific content guide, not answer capsule", () => {
    const gap =
      'On-site content doesn\'t support prompt: "best CRM for agencies under 50 seats"';
    const fix = getFixForGap(gap, domain);
    expect(fix.id).toBe("prompt-content");
    expect(fix.title).toContain("best CRM for agencies");
    expect(fix.title).not.toContain("Answer Capsule");
  });

  it("maps thin homepage gaps to answer capsule content guide", () => {
    const fix = getFixForGap(
      "Thin homepage content (<300 words) — add an answer capsule above the fold",
      domain,
    );
    expect(fix.id).toBe("answer-capsule");
    expect(fix.category).toBe("content");
  });

  it("maps organization schema gaps to org schema", () => {
    const fix = getFixForGap("No Organization schema — weakens brand entity recognition", domain);
    expect(fix.id).toBe("org-schema");
  });

  it("maps generic json-ld gaps to FAQ schema starter", () => {
    const fix = getFixForGap("No JSON-LD structured data detected on the homepage", domain);
    expect(fix.id).toBe("faq-schema");
  });

  it("returns distinct fixes for different gap types", () => {
    const faq = getFixForGap("Missing FAQPage schema", domain);
    const prompt = getFixForGap(
      'On-site content doesn\'t support prompt: "how to choose a CRM"',
      domain,
    );
    const robots = getFixForGap("robots.txt may block crawlers — verify AI bot access", domain);

    expect(faq.id).not.toBe(prompt.id);
    expect(prompt.id).not.toBe(robots.id);
    expect(robots.id).toBe("robots");
  });
});

describe("getFixActionLabel", () => {
  it("labels schema fixes as Quick Fix", () => {
    expect(getFixActionLabel("Missing FAQPage schema", domain)).toBe("Quick Fix");
  });

  it("labels prompt gaps as Content guide", () => {
    expect(
      getFixActionLabel(
        'On-site content doesn\'t support prompt: "best tool for agencies"',
        domain,
      ),
    ).toBe("Content guide");
  });

  it("labels robots.txt as Deploy fix", () => {
    expect(getFixActionLabel("robots.txt may block crawlers", domain)).toBe("Deploy fix");
  });
});
