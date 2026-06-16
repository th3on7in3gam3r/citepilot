import { describe, expect, it } from "vitest";
import {
  formatValidationErrorMessage,
  parseTestDigestRequest,
} from "@/lib/notifications/test-digest-schema";

describe("parseTestDigestRequest", () => {
  it("accepts weekly_digest with workspaceId", () => {
    const result = parseTestDigestRequest({
      type: "weekly_digest",
      workspaceId: "ws_123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        type: "weekly_digest",
        workspaceId: "ws_123",
      });
    }
  });

  it("accepts drop_alert with workspaceId", () => {
    const result = parseTestDigestRequest({
      type: "drop_alert",
      workspaceId: "ws_123",
    });
    expect(result.success).toBe(true);
  });

  it("requires workspaceId", () => {
    const result = parseTestDigestRequest({ type: "weekly_digest" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.workspaceId).toBeDefined();
    }
  });

  it("requires type", () => {
    const result = parseTestDigestRequest({ workspaceId: "ws_123" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.type).toBeDefined();
    }
  });

  it("rejects invalid type", () => {
    const result = parseTestDigestRequest({
      type: "invalid",
      workspaceId: "ws_123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = formatValidationErrorMessage(result.error.flatten());
      expect(msg).toContain("weekly_digest");
    }
  });
});
