import { describe, expect, it } from "vitest";
import { isNeonHostname, shouldUseTcpPostgres } from "@/lib/db/query";

describe("postgres driver selection", () => {
  it("detects Neon hosts", () => {
    expect(
      isNeonHostname(
        "postgresql://u:p@ep-foo-pooler.us-east-1.aws.neon.tech/neondb",
      ),
    ).toBe(true);
    expect(
      isNeonHostname(
        "postgresql://postgres:p@db.gbiamtgvzlirjnxyxotw.supabase.co:5432/postgres",
      ),
    ).toBe(false);
  });

  it("uses TCP for Supabase and when RENDER=true", () => {
    const prev = process.env.RENDER;
    delete process.env.RENDER;
    expect(
      shouldUseTcpPostgres(
        "postgresql://postgres:p@db.xxx.supabase.co:5432/postgres",
      ),
    ).toBe(true);
    expect(
      shouldUseTcpPostgres(
        "postgresql://u:p@ep-foo.us-east-1.aws.neon.tech/neondb",
      ),
    ).toBe(false);

    process.env.RENDER = "true";
    expect(
      shouldUseTcpPostgres(
        "postgresql://u:p@ep-foo.us-east-1.aws.neon.tech/neondb",
      ),
    ).toBe(true);

    if (prev === undefined) delete process.env.RENDER;
    else process.env.RENDER = prev;
  });
});
