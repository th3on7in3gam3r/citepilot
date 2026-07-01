import { describe, expect, it } from "vitest";
import { HashnodeApiError, normalizeHashnodePublicationId } from "@/lib/cms/hashnode";

describe("normalizeHashnodePublicationId", () => {
  it("extracts id from dashboards URL", () => {
    expect(
      normalizeHashnodePublicationId(
        "https://hashnode.com/dashboards/6a44a1188a5c8f824dfd9f94/",
      ),
    ).toBe("6a44a1188a5c8f824dfd9f94");
  });

  it("accepts raw object id", () => {
    expect(normalizeHashnodePublicationId("6a44a1188a5c8f824dfd9f94")).toBe(
      "6a44a1188a5c8f824dfd9f94",
    );
  });
});

describe("HashnodeApiError", () => {
  it("carries HTTP status for publish route handling", () => {
    const error = new HashnodeApiError("Publication not found", 404);
    expect(error.message).toContain("Publication not found");
    expect(error.status).toBe(404);
  });
});
