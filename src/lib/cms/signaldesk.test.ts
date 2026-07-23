import { describe, expect, it } from "vitest";
import {
  buildSignalDeskPublishBody,
  ensureMinLength,
  normalizeSignalDeskSiteUrl,
  resolveAbsoluteCoverUrl,
  signalDeskAuthHeader,
} from "@/lib/cms/signaldesk";

describe("signaldesk", () => {
  it("normalizes site URL and builds Basic auth", () => {
    expect(normalizeSignalDeskSiteUrl("signaldesk.example/")).toBe(
      "https://signaldesk.example",
    );
    expect(
      signalDeskAuthHeader({
        siteUrl: "https://signaldesk.example",
        username: "citepilot",
        appPassword: "secret",
      }),
    ).toBe(`Basic ${Buffer.from("citepilot:secret").toString("base64")}`);
  });

  it("pads short meta fields to Signal Desk minimums", () => {
    expect(ensureMinLength("short", 40, "pad").length).toBeGreaterThanOrEqual(40);
  });

  it("publishes live when cover exists, otherwise review", () => {
    const live = buildSignalDeskPublishBody({
      siteUrl: "https://desk.example",
      title: "GEO score guide for SaaS teams in 2026",
      slug: "geo-score-guide",
      html: "<p>Body</p>",
      description: "A practical guide to improving AI citation rates across ChatGPT and Perplexity.",
      coverImageUrl: "https://cdn.example.com/cover.jpg",
    });
    expect(live.status).toBe("publish");
    expect(live.meta.cover_image_url).toBe("https://cdn.example.com/cover.jpg");
    expect(live.meta.canonical_url).toBe("https://desk.example/posts/geo-score-guide");
    expect(live.meta.description.length).toBeGreaterThanOrEqual(40);
    expect(live.meta.answer_block.length).toBeGreaterThanOrEqual(40);

    const review = buildSignalDeskPublishBody({
      siteUrl: "https://desk.example",
      title: "Draft without cover",
      slug: "draft-no-cover",
      html: "<p>Body</p>",
      description: "Short",
    });
    expect(review.status).toBe("review");
    expect(review.meta.cover_image_url).toBeUndefined();
  });

  it("resolves relative cover paths against the CitePilot asset origin", () => {
    expect(
      resolveAbsoluteCoverUrl("/images/blog/x.jpg", "https://desk.example"),
    ).toBe("https://getcitepilot.com/images/blog/x.jpg");
    expect(
      resolveAbsoluteCoverUrl(
        "/images/blog/x.jpg",
        "https://desk.example",
        "https://desk.example",
      ),
    ).toBe("https://desk.example/images/blog/x.jpg");
    expect(resolveAbsoluteCoverUrl(null, "https://desk.example")).toBeNull();
  });
});
