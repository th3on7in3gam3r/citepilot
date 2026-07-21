import { describe, expect, it } from "vitest";
import { neonAuthBaseUrlLooksValid } from "@/lib/auth/neon-auth-health";

describe("neonAuthBaseUrlLooksValid", () => {
  it("accepts Console-style Auth URLs", () => {
    expect(
      neonAuthBaseUrlLooksValid(
        "https://ep-xxx.neonauth.us-east-1.aws.neon.tech/neondb/auth",
      ),
    ).toBe(true);
  });

  it("rejects missing /auth path or non-https", () => {
    expect(
      neonAuthBaseUrlLooksValid(
        "https://ep-xxx.us-east-1.aws.neon.tech/neondb",
      ),
    ).toBe(false);
    expect(
      neonAuthBaseUrlLooksValid(
        "http://ep-xxx.neonauth.us-east-1.aws.neon.tech/neondb/auth",
      ),
    ).toBe(false);
  });
});
