import { describe, expect, it } from "vitest";
import { parseCoverImageMeta } from "@/lib/blog/cover-meta";

describe("parseCoverImageMeta", () => {
  it("returns empty metadata when markdown is missing", () => {
    expect(parseCoverImageMeta(undefined)).toEqual({});
    expect(parseCoverImageMeta(null)).toEqual({});
    expect(parseCoverImageMeta("   ")).toEqual({});
  });

  it("parses cover comments from markdown", () => {
    expect(
      parseCoverImageMeta(`<!-- cover-image: /images/blog/example.jpg -->
<!-- cover-image-alt: Example cover -->
# Title`),
    ).toEqual({
      coverImageUrl: "/images/blog/example.jpg",
      coverImageAlt: "Example cover",
    });
  });
});
