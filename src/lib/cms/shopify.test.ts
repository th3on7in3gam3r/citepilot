import { afterEach, describe, expect, it, vi } from "vitest";
import { ShopifyApiError, testShopifyConnection } from "@/lib/cms/shopify";

function mockFetch(response: {
  ok?: boolean;
  status?: number;
  contentType?: string;
  body: string;
}) {
  return vi.fn().mockResolvedValue({
    ok: response.ok ?? true,
    status: response.status ?? 200,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "content-type" ? (response.contentType ?? "application/json") : null,
    },
    text: async () => response.body,
  });
}

describe("testShopifyConnection", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requires an access token", async () => {
    await expect(
      testShopifyConnection({ shopDomain: "demo.myshopify.com", accessToken: "   " }),
    ).rejects.toMatchObject({
      message: "Admin access token is required.",
      status: 400,
    });
  });

  it("surfaces HTML login pages instead of JSON parse errors", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        contentType: "text/html",
        body: "<!DOCTYPE html><html><body>Login</body></html>",
      }),
    );

    await expect(
      testShopifyConnection({
        shopDomain: "demo.myshopify.com",
        accessToken: "shpat_test",
      }),
    ).rejects.toMatchObject({
      message: expect.stringContaining("returned HTML instead of JSON"),
      status: 502,
    });
  });

  it("surfaces invalid JSON responses clearly", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        body: "not-json",
      }),
    );

    await expect(
      testShopifyConnection({
        shopDomain: "demo.myshopify.com",
        accessToken: "shpat_test",
      }),
    ).rejects.toMatchObject({
      message: "Shopify returned an invalid response. Check the shop domain and access token.",
      status: 502,
    });
  });

  it("maps HTTP 401 to a token reinstall message", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        ok: false,
        status: 401,
        body: JSON.stringify({ errors: "Unauthorized" }),
      }),
    );

    await expect(
      testShopifyConnection({
        shopDomain: "demo.myshopify.com",
        accessToken: "shpat_bad",
      }),
    ).rejects.toMatchObject({
      message: expect.stringContaining("rejected the access token"),
      status: 401,
    });
  });

  it("maps GraphQL ACCESS_DENIED to scope guidance", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        body: JSON.stringify({
          errors: [{ message: "Access denied", extensions: { code: "ACCESS_DENIED" } }],
        }),
      }),
    );

    await expect(
      testShopifyConnection({
        shopDomain: "demo.myshopify.com",
        accessToken: "shpat_scoped",
      }),
    ).rejects.toMatchObject({
      message: expect.stringContaining("read_content and write_content"),
      status: 403,
    });
  });

  it("connects when the store returns a blog", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        body: JSON.stringify({
          data: {
            shop: { name: "Demo Store" },
            blogs: {
              nodes: [{ id: "gid://shopify/Blog/1", title: "News", handle: "news" }],
            },
          },
        }),
      }),
    );

    const result = await testShopifyConnection({
      shopDomain: "demo-store",
      accessToken: "shpat_ok",
    });

    expect(result).toMatchObject({
      displayName: "demo-store.myshopify.com",
      siteUrl: "https://demo-store.myshopify.com",
      detail: "Publishing to blog: News",
      remoteDefaults: {
        blogId: "gid://shopify/Blog/1",
        blogTitle: "News",
        blogHandle: "news",
        shopName: "Demo Store",
      },
    });
  });
});

describe("ShopifyApiError", () => {
  it("carries HTTP status for API routes", () => {
    const error = new ShopifyApiError("Shopify publish failed", 400);
    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(400);
  });
});
