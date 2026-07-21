import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isLocalDevelopment,
  isProductionRuntime,
  platformHost,
} from "@/lib/env/runtime";

describe("runtime env helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("detects Vercel production", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(isProductionRuntime()).toBe(true);
    expect(isLocalDevelopment()).toBe(false);
  });

  it("detects Render production", () => {
    vi.stubEnv("RENDER", "true");
    vi.stubEnv("NODE_ENV", "production");
    expect(isProductionRuntime()).toBe(true);
    expect(isLocalDevelopment()).toBe(false);
  });

  it("treats local next dev as development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(isProductionRuntime()).toBe(false);
    expect(isLocalDevelopment()).toBe(true);
  });

  it("reads RENDER_EXTERNAL_URL host", () => {
    vi.stubEnv("RENDER_EXTERNAL_URL", "https://citepilot.onrender.com");
    expect(platformHost()).toBe("citepilot.onrender.com");
  });
});
