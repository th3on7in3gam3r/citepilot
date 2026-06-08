import { afterEach, describe, expect, it } from "vitest";
import { allowedCorsOrigins, isAllowedCorsOrigin } from "@/lib/cors";

describe("cors", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_URL;
  });

  it("allows production and local dev origins", () => {
    const origins = allowedCorsOrigins();
    expect(origins.has("https://getcitepilot.com")).toBe(true);
    expect(origins.has("https://www.getcitepilot.com")).toBe(true);
    expect(origins.has("http://localhost:3000")).toBe(true);
  });

  it("includes NEXT_PUBLIC_APP_URL when set", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://preview.example.com";
    expect(isAllowedCorsOrigin("https://preview.example.com")).toBe(true);
  });

  it("rejects unknown origins", () => {
    expect(isAllowedCorsOrigin("https://evil.example")).toBe(false);
    expect(isAllowedCorsOrigin(null)).toBe(false);
  });
});
