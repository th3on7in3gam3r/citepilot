import { describe, expect, it } from "vitest";
import { shouldApplyWorkspaceLoad } from "@/hooks/useWorkspace";

describe("shouldApplyWorkspaceLoad", () => {
  it("applies when epoch and stored id are unchanged", () => {
    expect(shouldApplyWorkspaceLoad(1, 1, "ws-a", "ws-a")).toBe(true);
  });

  it("rejects when a newer switch bumped the epoch", () => {
    expect(shouldApplyWorkspaceLoad(1, 2, "ws-a", "ws-a")).toBe(false);
  });

  it("rejects when storage moved to another workspace mid-flight", () => {
    expect(shouldApplyWorkspaceLoad(1, 1, "ws-a", "ws-b")).toBe(false);
  });

  it("allows null expected id (fallback path) when epoch matches", () => {
    expect(shouldApplyWorkspaceLoad(3, 3, null, null)).toBe(true);
    expect(shouldApplyWorkspaceLoad(3, 4, null, "ws-a")).toBe(false);
  });
});
