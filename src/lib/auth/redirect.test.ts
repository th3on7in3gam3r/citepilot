import { describe, expect, it } from "vitest";
import { buildStartRedirect, resolveAuthRedirect } from "@/lib/auth/redirect";

describe("resolveAuthRedirect", () => {
  it("returns explicit internal paths", () => {
    expect(resolveAuthRedirect("/dashboard")).toBe("/dashboard");
    expect(resolveAuthRedirect("/invite/abc")).toBe("/invite/abc");
  });

  it("rejects protocol-relative and external URLs", () => {
    expect(resolveAuthRedirect("//evil.com")).toBe("/start");
    expect(resolveAuthRedirect("https://evil.com")).toBe("/start");
  });

  it("defaults to /start", () => {
    expect(resolveAuthRedirect(null)).toBe("/start");
    expect(resolveAuthRedirect("")).toBe("/start");
  });
});

describe("buildStartRedirect", () => {
  it("includes domain query when provided", () => {
    expect(buildStartRedirect("example.com")).toBe("/start?domain=example.com");
  });

  it("returns bare /start without domain", () => {
    expect(buildStartRedirect()).toBe("/start");
    expect(buildStartRedirect("  ")).toBe("/start");
  });
});
