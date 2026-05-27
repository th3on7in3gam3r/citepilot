import { afterEach, describe, expect, it } from "vitest";
import { ensureDb } from "@/lib/db";
import { checkHourlyRateLimit } from "@/lib/rate-limit/hourly";

describe("checkHourlyRateLimit", () => {
  afterEach(() => {
    const globalDb = globalThis as { citepilotDb?: { close: () => void } };
    if (globalDb.citepilotDb) {
      globalDb.citepilotDb.close();
      delete globalDb.citepilotDb;
    }
  });

  it("allows requests under the limit", async () => {
    await ensureDb();
    const subject = `test:${Date.now()}`;
    const first = await checkHourlyRateLimit(subject, 3);
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(2);

    const second = await checkHourlyRateLimit(subject, 3);
    expect(second.allowed).toBe(true);
  });

  it("blocks when limit exceeded", async () => {
    await ensureDb();
    const subject = `test-block:${Date.now()}`;
    await checkHourlyRateLimit(subject, 1);
    const blocked = await checkHourlyRateLimit(subject, 1);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });
});
