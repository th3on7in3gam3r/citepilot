import { describe, expect, it } from "vitest";
import { agencyDisplayName } from "@/lib/email/resolve-logo";

describe("agencyDisplayName", () => {
  it("prefers explicit agency name", () => {
    expect(agencyDisplayName("Acme Agency", "client.com")).toBe("Acme Agency");
  });

  it("derives from domain when agency name is empty", () => {
    expect(agencyDisplayName("", "biblefunlandstudios.com")).toBe("Biblefunlandstudios");
  });
});
