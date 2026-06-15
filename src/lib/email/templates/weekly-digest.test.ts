import { describe, expect, it } from "vitest";
import { buildWeeklyDigestEmail } from "@/lib/email/templates/weekly-digest";

describe("buildWeeklyDigestEmail", () => {
  it("renders branded HTML with score, gaps, and CTAs", () => {
    const { html, text, subject } = buildWeeklyDigestEmail({
      domain: "acmeplumbing.com",
      buyerQuestion: "Who is the best plumber near me?",
      competitors: ["Roto-Rooter", "Mr. Rooter"],
      score: 72,
      previousScore: 68,
      gaps: ["Add FAQ schema", "Publish comparison page"],
    });

    expect(subject).toContain("acmeplumbing.com");
    expect(subject).toContain("72/100");
    expect(html).toContain("Citation score");
    expect(html).toContain("72");
    expect(html).toContain("▲ +4");
    expect(html).toContain("Who is the best plumber near me?");
    expect(html).toContain("Add FAQ schema");
    expect(html).toContain("Roto-Rooter");
    expect(html).toContain("Open analytics dashboard");
    expect(html).toContain("View proof report");
    expect(text).toContain("Priority actions:");
    expect(text).toContain("1. Add FAQ schema");
  });

  it("applies fleet white-label branding without broken logo URLs", () => {
    const { html } = buildWeeklyDigestEmail({
      domain: "client.com",
      buyerQuestion: "Best CRM?",
      competitors: [],
      score: 55,
      previousScore: null,
      gaps: ["Improve entity coverage"],
      fleetBranding: true,
      workspaceId: "ws_1",
      whiteLabel: {
        agencyName: "Growth Agency",
        logoUrl: "",
        hidePoweredBy: false,
        poweredByMode: "agency_via_citepilot",
        primaryColor: "#6366f1",
        customReportDomain: "",
        customDomainVerified: false,
        emailFromName: "",
        replyToEmail: "",
      },
    });

    expect(html).toContain("Growth Agency");
    expect(html).not.toContain("/api/white-label/logo");
    expect(html).toContain("#6366f1");
    expect(html).toContain("Powered by Growth Agency via CitePilot");
  });

  it("falls back to domain name when agency name is empty", () => {
    const { html } = buildWeeklyDigestEmail({
      domain: "biblefunlandstudios.com",
      buyerQuestion: "test",
      competitors: [],
      score: 45,
      previousScore: null,
      gaps: [],
      fleetBranding: true,
      whiteLabel: {
        agencyName: "",
        logoUrl: "",
        hidePoweredBy: false,
        poweredByMode: "agency_via_citepilot",
        primaryColor: "#0ea5e9",
        customReportDomain: "",
        customDomainVerified: false,
        emailFromName: "",
        replyToEmail: "",
      },
    });

    expect(html).not.toContain("/api/white-label/logo");
    expect(html).toContain("Powered by Biblefunlandstudios via CitePilot");
  });
});
