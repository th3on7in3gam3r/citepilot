import { describe, expect, it } from "vitest";

/** Mirrors publish route validation — keep in sync with CMS publish handlers. */
function validatePublishBody(body: { postId?: string; provider?: string }): string | null {
  if (!body.postId?.trim()) return "postId is required";
  if (!body.provider?.trim()) return "provider is required";
  return null;
}

describe("CMS publish request validation", () => {
  it("requires postId and provider", () => {
    expect(validatePublishBody({})).toBe("postId is required");
    expect(validatePublishBody({ postId: "abc" })).toBe("provider is required");
    expect(validatePublishBody({ postId: "abc", provider: "wordpress" })).toBeNull();
  });
});
