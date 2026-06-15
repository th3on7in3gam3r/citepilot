import { describe, expect, it } from "vitest";
import { parseTestDigestRequest } from "@/lib/notifications/test-digest-schema";

describe("parseTestDigestRequest", () => {
  it("accepts workspaceId and email", () => {
    const result = parseTestDigestRequest({
      workspaceId: "ws_123",
      email: "you@example.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        workspaceId: "ws_123",
        email: "you@example.com",
      });
    }
  });

  it("requires workspaceId", () => {
    const result = parseTestDigestRequest({ email: "you@example.com" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.workspaceId).toBeDefined();
    }
  });

  it("rejects invalid email", () => {
    const result = parseTestDigestRequest({
      workspaceId: "ws_123",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });
});
