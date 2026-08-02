import { describe, expect, it } from "vitest";
import {
  getRecognitionItems,
  isRealProductHuntListingUrl,
} from "@/lib/data/recognition";

describe("isRealProductHuntListingUrl", () => {
  it("rejects bare Product Hunt homepage", () => {
    expect(isRealProductHuntListingUrl("https://www.producthunt.com")).toBe(
      false,
    );
    expect(isRealProductHuntListingUrl("https://producthunt.com/")).toBe(false);
  });

  it("accepts posts and products listing paths", () => {
    expect(
      isRealProductHuntListingUrl("https://www.producthunt.com/posts/citepilot"),
    ).toBe(true);
    expect(
      isRealProductHuntListingUrl(
        "https://www.producthunt.com/products/citepilot",
      ),
    ).toBe(true);
  });
});

describe("getRecognitionItems", () => {
  it("omits Product Hunt when URL is the bare homepage", () => {
    const items = getRecognitionItems("https://www.producthunt.com");
    expect(items.some((i) => i.kind === "product_hunt")).toBe(false);
    expect(items.map((i) => i.kind)).toEqual(
      expect.arrayContaining(["press", "listing_cta"]),
    );
  });

  it("includes Product Hunt when a real listing URL is provided", () => {
    const listing = "https://www.producthunt.com/posts/citepilot";
    const items = getRecognitionItems(listing);
    const ph = items.find((i) => i.kind === "product_hunt");
    expect(ph?.href).toBe(listing);
    expect(items.some((i) => i.href === "/press")).toBe(true);
    expect(items.some((i) => i.kind === "listing_cta")).toBe(true);
  });
});
