import { describe, expect, it } from "vitest";
import {
  competitors,
  formatComparisonCell,
  getCompetitor,
} from "@/lib/data/competitors";
import { linkCompetitorNamesInMarkdown } from "@/lib/blog/competitor-links";

describe("competitors", () => {
  it("includes five comparison slugs", () => {
    expect(competitors.map((c) => c.slug)).toEqual([
      "semrush",
      "ahrefs",
      "moz",
      "brightedge",
      "conductor",
    ]);
  });

  it("resolves by slug", () => {
    expect(getCompetitor("semrush")?.name).toBe("Semrush");
    expect(getCompetitor("unknown")).toBeUndefined();
  });

  it("formats comparison cells", () => {
    expect(formatComparisonCell("yes")).toBe("✓");
    expect(formatComparisonCell("limited")).toBe("Limited");
  });
});

describe("linkCompetitorNamesInMarkdown", () => {
  it("links first Semrush mention", () => {
    const out = linkCompetitorNamesInMarkdown("We use Semrush for keywords.");
    expect(out).toContain("[Semrush](/compare/semrush)");
  });
});
