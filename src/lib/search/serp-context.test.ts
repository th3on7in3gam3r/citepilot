import { describe, expect, it } from "vitest";
import {
  buildSerpQueries,
  domainRankInSerp,
} from "@/lib/search/serp-context";
import type { WorkspaceSnapshotResponse } from "@/lib/api-types";

function snapshot(
  partial: Partial<WorkspaceSnapshotResponse>,
): WorkspaceSnapshotResponse {
  return {
    id: "ws-1",
    domain: "acme.com",
    businessType: "saas",
    description: "Acme builds widgets",
    audiences: [],
    competitors: ["rival.io"],
    buyerQuestion: "best widget software for startups",
    preferences: {} as WorkspaceSnapshotResponse["preferences"],
    updatedAt: "2026-01-01",
    citationScore: 42,
    hasRealAudit: true,
    auditMode: "live",
    citedPlatforms: 2,
    totalPlatforms: 8,
    gaps: [],
    promptResults: [],
    platformPresence: [],
    ...partial,
  };
}

describe("buildSerpQueries", () => {
  it("prioritizes buyer question and uncited prompts", () => {
    const queries = buildSerpQueries(
      snapshot({
        buyerQuestion: "how to get cited by ChatGPT",
        promptResults: [
          { prompt: "top widget tools 2026", cited: false, reason: "not cited" },
          { prompt: "widget comparison", cited: false, reason: "not cited" },
        ],
      }),
    );

    expect(queries[0]).toBe("how to get cited by ChatGPT");
    expect(queries).toContain("top widget tools 2026");
    expect(queries.length).toBeLessThanOrEqual(3);
  });

  it("adds competitor comparison when slots remain", () => {
    const queries = buildSerpQueries(
      snapshot({
        buyerQuestion: "widget software",
        competitors: ["rival.io"],
        promptResults: [],
      }),
    );

    expect(queries.some((q) => q.includes("acme") && q.includes("rival.io"))).toBe(
      true,
    );
  });
});

describe("domainRankInSerp", () => {
  it("returns organic position when domain matches", () => {
    expect(
      domainRankInSerp("acme.com", [
        { position: 1, link: "https://other.com", title: "Other" },
        { position: 4, link: "https://www.acme.com/pricing", title: "Acme" },
      ]),
    ).toBe(4);
  });

  it("returns null when domain is absent", () => {
    expect(
      domainRankInSerp("acme.com", [
        { position: 1, link: "https://other.com", title: "Other" },
      ]),
    ).toBeNull();
  });
});
