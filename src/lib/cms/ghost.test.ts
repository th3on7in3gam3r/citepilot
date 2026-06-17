import { describe, expect, it } from "vitest";
import { ghostJwt, GhostApiError } from "@/lib/cms/ghost";

describe("ghostJwt", () => {
  it("builds a JWT from a valid Admin API key", () => {
    const secret = "a".repeat(64);
    const token = ghostJwt(`66778899:${secret}`);
    expect(token.split(".")).toHaveLength(3);
  });

  it("rejects keys without id:secret format", () => {
    expect(() => ghostJwt("only-one-part")).toThrow(GhostApiError);
  });

  it("rejects non-hex secrets", () => {
    expect(() => ghostJwt("66778899:not-hex-secret")).toThrow(GhostApiError);
  });
});
