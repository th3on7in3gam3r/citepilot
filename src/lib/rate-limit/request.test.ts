import { describe, expect, it } from "vitest";
import { clientIpFromRequest } from "@/lib/rate-limit/request";

describe("clientIpFromRequest", () => {
  it("uses the first x-forwarded-for hop", () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "203.0.113.1, 10.0.0.1" },
    });
    expect(clientIpFromRequest(request)).toBe("203.0.113.1");
  });

  it("falls back to x-real-ip", () => {
    const request = new Request("https://example.com", {
      headers: { "x-real-ip": "198.51.100.2" },
    });
    expect(clientIpFromRequest(request)).toBe("198.51.100.2");
  });

  it("returns unknown when no proxy headers are present", () => {
    expect(clientIpFromRequest(new Request("https://example.com"))).toBe(
      "unknown",
    );
  });
});
