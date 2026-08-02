import { describe, expect, it } from "vitest";
import {
  GROWTH_STACK,
  kerygmaAppHref,
  kerygmaSignUpUrl,
  withUtm,
} from "@/lib/growth-stack";

describe("withUtm", () => {
  it("appends source and campaign without dropping existing params", () => {
    const tagged = withUtm("https://kerygmasocial.com/sign-up?url=https%3A%2F%2Facme.com&redirect_url=%2Fonboarding", {
      source: "citepilot",
      campaign: "audit-result",
      medium: "referral",
    });
    const u = new URL(tagged);
    expect(u.searchParams.get("url")).toBe("https://acme.com");
    expect(u.searchParams.get("redirect_url")).toBe("/onboarding");
    expect(u.searchParams.get("utm_source")).toBe("citepilot");
    expect(u.searchParams.get("utm_campaign")).toBe("audit-result");
    expect(u.searchParams.get("utm_medium")).toBe("referral");
  });

  it("lowercases source/medium and sets content when provided", () => {
    const tagged = withUtm(GROWTH_STACK.kerygma.href, {
      source: "Cadence",
      campaign: "spring-launch",
      medium: "Email",
      content: "hero-a",
    });
    const u = new URL(tagged);
    expect(u.searchParams.get("utm_source")).toBe("cadence");
    expect(u.searchParams.get("utm_medium")).toBe("email");
    expect(u.searchParams.get("utm_content")).toBe("hero-a");
  });
});

describe("kerygma helpers", () => {
  it("kerygmaAppHref tags homepage for Pulse", () => {
    const href = kerygmaAppHref("footer", "growth-stack");
    expect(href).toContain("utm_source=citepilot");
    expect(href).toContain("utm_campaign=footer");
    expect(href).toContain("utm_medium=referral");
    expect(href).toContain("utm_content=growth-stack");
  });

  it("kerygmaSignUpUrl keeps domain params and adds UTMs", () => {
    const href = kerygmaSignUpUrl("acme.com");
    const u = new URL(href);
    expect(u.pathname).toBe("/sign-up");
    expect(u.searchParams.get("url")).toBe("https://acme.com");
    expect(u.searchParams.get("utm_source")).toBe("citepilot");
    expect(u.searchParams.get("utm_campaign")).toBe("audit-result");
    expect(u.searchParams.get("utm_content")).toBe("audit-cta");
  });
});
