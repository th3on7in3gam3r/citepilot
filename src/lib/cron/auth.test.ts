import { afterEach, describe, expect, it, vi } from "vitest";
import { requireCronAuth } from "@/lib/cron/auth";

describe("requireCronAuth", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects missing bearer token when secret is set", () => {
    vi.stubEnv("CRON_SECRET", "test-secret");
    vi.stubEnv("VERCEL_ENV", "production");
    const res = requireCronAuth(new Request("https://example.com/api/cron/test"));
    expect(res).not.toBeNull();
    expect(res?.status).toBe(401);
  });

  it("allows valid bearer token", () => {
    vi.stubEnv("CRON_SECRET", "test-secret");
    vi.stubEnv("VERCEL_ENV", "production");
    const res = requireCronAuth(
      new Request("https://example.com/api/cron/test", {
        headers: { Authorization: "Bearer test-secret" },
      }),
    );
    expect(res).toBeNull();
  });
});
