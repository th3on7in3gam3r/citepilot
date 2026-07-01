import { describe, expect, it } from "vitest";
import { HashnodeApiError } from "@/lib/cms/hashnode";

describe("HashnodeApiError", () => {
  it("carries HTTP status for publish route handling", () => {
    const error = new HashnodeApiError("Publication not found", 404);
    expect(error.message).toContain("Publication not found");
    expect(error.status).toBe(404);
  });
});
