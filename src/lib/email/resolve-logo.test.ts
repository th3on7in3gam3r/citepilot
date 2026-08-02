import { describe, expect, it } from "vitest";
import {
  agencyDisplayName,
  hostedWhiteLabelLogoUrl,
} from "@/lib/email/resolve-logo";

describe("hostedWhiteLabelLogoUrl", () => {
  it("builds a public HTTPS logo endpoint", () => {
    const url = hostedWhiteLabelLogoUrl("ws_abc");
    expect(url).toContain("/api/white-label/logo?workspaceId=ws_abc");
    expect(url).not.toContain("data:");
  });
});

describe("agencyDisplayName", () => {
  it("prefers explicit agency name", () => {
    expect(agencyDisplayName("Acme Agency", "client.com")).toBe("Acme Agency");
  });

  it("derives from domain when agency name is empty", () => {
    expect(agencyDisplayName("", "biblefunlandstudios.com")).toBe("Biblefunlandstudios");
  });
});
