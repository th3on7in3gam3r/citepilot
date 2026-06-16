import { describe, expect, it } from "vitest";
import {
  createDigestUnsubscribeToken,
  digestUnsubscribeUrl,
  verifyDigestUnsubscribeToken,
} from "@/lib/email/unsubscribe";

describe("digest unsubscribe", () => {
  it("creates and verifies workspace digest tokens", () => {
    const token = createDigestUnsubscribeToken("ws_abc");
    expect(verifyDigestUnsubscribeToken("ws_abc", token)).toBe(true);
    expect(verifyDigestUnsubscribeToken("ws_other", token)).toBe(false);
  });

  it("builds digest unsubscribe URL", () => {
    const url = digestUnsubscribeUrl("ws_abc");
    expect(url).toContain("/api/email/unsubscribe-digest");
    expect(url).toContain("ws=ws_abc");
    expect(url).toContain("token=");
  });
});
