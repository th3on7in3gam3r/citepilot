import { describe, expect, it } from "vitest";
import { dedupeBlogPostsByTitle, normalizeBlogTitle } from "@/lib/blog/dedupe";
import { resolvePublicCover } from "@/lib/blog/stock-covers";

describe("normalizeBlogTitle", () => {
  it("collapses punctuation and trailing periods", () => {
    expect(normalizeBlogTitle("Light Weekly Roundup For Founders.")).toBe(
      "light weekly roundup for founders",
    );
    expect(normalizeBlogTitle("Light Weekly Roundup For Founders")).toBe(
      "light weekly roundup for founders",
    );
  });
});

describe("dedupeBlogPostsByTitle", () => {
  it("keeps the first (newest) post per normalized title", () => {
    const posts = [
      {
        slug: "light-weekly-roundup-for-founders-5",
        title: "Light Weekly Roundup For Founders.",
        publishedAt: "2026-08-05",
      },
      {
        slug: "light-weekly-roundup-for-founders-1",
        title: "Light Weekly Roundup For Founders",
        publishedAt: "2026-07-01",
      },
      {
        slug: "other-unique",
        title: "How to Get Cited by ChatGPT",
        publishedAt: "2026-05-20",
      },
    ];
    const out = dedupeBlogPostsByTitle(posts);
    expect(out.map((p) => p.slug)).toEqual([
      "light-weekly-roundup-for-founders-5",
      "other-unique",
    ]);
  });
});

describe("resolvePublicCover", () => {
  it("keeps an existing cover URL", () => {
    const cover = resolvePublicCover({
      slug: "x",
      pillar: "geo",
      coverImageUrl: "/images/blog/how-to-get-cited-by-chatgpt.jpg",
    });
    expect(cover.coverImageUrl).toContain("how-to-get-cited-by-chatgpt");
  });

  it("assigns a stock cover when missing", () => {
    const cover = resolvePublicCover({
      slug: "light-weekly-roundup-for-founders-5",
      pillar: "geo",
    });
    expect(cover.coverImageUrl).toMatch(/^https:\/\//);
  });
});
