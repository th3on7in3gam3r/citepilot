import { markdownToCmsHtml } from "@/lib/cms/markdown-to-html";
import type { ShopifyCredentials } from "@/lib/cms/types";

export class ShopifyApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function normalizeShopDomain(value: string): string {
  const trimmed = value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
  return trimmed.endsWith(".myshopify.com")
    ? trimmed
    : `${trimmed}.myshopify.com`;
}

function normalizeAccessToken(value: string): string {
  return value.trim();
}

function looksLikeHtml(text: string, contentType: string): boolean {
  if (contentType.includes("text/html")) return true;
  const trimmed = text.trimStart().toLowerCase();
  return trimmed.startsWith("<!doctype") || trimmed.startsWith("<html");
}

function friendlyShopifyHttpError(status: number, domain: string): string {
  if (status === 401) {
    return "Shopify rejected the access token. Regenerate the Admin API token and ensure the custom app is installed on this store.";
  }
  if (status === 403) {
    return "Shopify denied access. Enable write_content (and read_content) on your custom app, reinstall it, and copy the new token.";
  }
  if (status === 404) {
    return `Shopify store not found at ${domain}. Use the .myshopify.com admin domain (e.g. my-store.myshopify.com).`;
  }
  return `Shopify request failed (${status})`;
}

async function shopifyGraphql<T>(
  credentials: ShopifyCredentials,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const domain = normalizeShopDomain(credentials.shopDomain);
  const accessToken = normalizeAccessToken(credentials.accessToken);
  if (!accessToken) {
    throw new ShopifyApiError("Admin access token is required.", 400);
  }

  const res = await fetch(`https://${domain}/admin/api/2026-04/graphql.json`, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const text = await res.text();
  const contentType = res.headers.get("content-type") ?? "";

  if (looksLikeHtml(text, contentType)) {
    throw new ShopifyApiError(
      `Shopify returned HTML instead of JSON for ${domain}. Confirm the shop domain ends with .myshopify.com and the access token is from an installed custom app.`,
      502,
    );
  }

  let body: {
    data?: T;
    errors?: { message?: string; extensions?: { code?: string } }[];
  };
  try {
    body = text ? (JSON.parse(text) as typeof body) : {};
  } catch {
    throw new ShopifyApiError(
      "Shopify returned an invalid response. Check the shop domain and access token.",
      502,
    );
  }

  if (!res.ok) {
    throw new ShopifyApiError(friendlyShopifyHttpError(res.status, domain), res.status);
  }

  if (body.errors?.length) {
    const first = body.errors[0];
    const code = first?.extensions?.code ?? "";
    if (code === "ACCESS_DENIED" || /access denied|not authorized/i.test(first?.message ?? "")) {
      throw new ShopifyApiError(
        "Shopify access denied. Your custom app needs read_content and write_content scopes, then must be reinstalled to refresh the token.",
        403,
      );
    }
    throw new ShopifyApiError(first?.message || "Shopify GraphQL request failed", 400);
  }

  if (!body.data) {
    throw new ShopifyApiError("Shopify returned an empty GraphQL response.", 502);
  }

  return body.data;
}

type ShopifyBlogInfo = {
  id: string;
  title: string;
  handle: string;
};

async function ensureShopifyBlog(
  credentials: ShopifyCredentials,
): Promise<ShopifyBlogInfo> {
  const query = `
    query CitePilotShopBlogs {
      shop { name }
      blogs(first: 10) {
        nodes { id title handle }
      }
    }
  `;
  const data = await shopifyGraphql<{
    shop: { name: string };
    blogs: { nodes: ShopifyBlogInfo[] };
  }>(credentials, query);

  if (data.blogs.nodes[0]) return data.blogs.nodes[0];

  const create = await shopifyGraphql<{
    blogCreate: {
      blog: ShopifyBlogInfo | null;
      userErrors: { message: string }[];
    };
  }>(
    credentials,
    `
      mutation CitePilotCreateBlog($blog: BlogCreateInput!) {
        blogCreate(blog: $blog) {
          blog { id title handle }
          userErrors { message }
        }
      }
    `,
    {
      blog: {
        title: "Blog",
        handle: "blog",
        templateSuffix: "standard",
        commentPolicy: "NO_COMMENTS",
      },
    },
  );

  const error = create.blogCreate.userErrors[0];
  if (error || !create.blogCreate.blog) {
    throw new ShopifyApiError(error?.message || "Could not create Shopify blog", 400);
  }

  return create.blogCreate.blog;
}

export async function testShopifyConnection(
  credentials: ShopifyCredentials,
): Promise<{
  displayName: string;
  siteUrl: string;
  detail: string;
  remoteDefaults: { blogId: string; blogTitle: string; blogHandle: string };
}> {
  const domain = normalizeShopDomain(credentials.shopDomain);
  const blog = await ensureShopifyBlog(credentials);

  return {
    displayName: domain,
    siteUrl: `https://${domain}`,
    detail: `Publishing to blog: ${blog.title}`,
    remoteDefaults: {
      blogId: blog.id,
      blogTitle: blog.title,
      blogHandle: blog.handle,
    },
  };
}

export async function publishPostToShopify(input: {
  credentials: ShopifyCredentials;
  blogId: string;
  blogHandle: string;
  title: string;
  slug: string;
  markdown: string;
  description: string;
  existingRemoteId?: string | null;
}): Promise<{ remoteId: string; liveUrl: string | null }> {
  const domain = normalizeShopDomain(input.credentials.shopDomain);
  const html = markdownToCmsHtml(input.markdown);

  if (input.existingRemoteId) {
    const data = await shopifyGraphql<{
      articleUpdate: {
        article: { id: string; handle: string } | null;
        userErrors: { message: string }[];
      };
    }>(
      input.credentials,
      `
        mutation CitePilotUpdateArticle($id: ID!, $article: ArticleUpdateInput!) {
          articleUpdate(id: $id, article: $article) {
            article { id handle }
            userErrors { message }
          }
        }
      `,
      {
        id: input.existingRemoteId,
        article: {
          blogId: input.blogId,
          title: input.title,
          handle: input.slug,
          body: html,
          summary: input.description,
          isPublished: true,
          redirectNewHandle: true,
        },
      },
    );

    const error = data.articleUpdate.userErrors[0];
    if (error || !data.articleUpdate.article) {
      throw new ShopifyApiError(error?.message || "Shopify update failed", 400);
    }

    return {
      remoteId: data.articleUpdate.article.id,
      liveUrl: `https://${domain}/blogs/${input.blogHandle}/${data.articleUpdate.article.handle}`,
    };
  }

  const data = await shopifyGraphql<{
    articleCreate: {
      article: { id: string; handle: string } | null;
      userErrors: { message: string }[];
    };
  }>(
    input.credentials,
    `
      mutation CitePilotCreateArticle($article: ArticleCreateInput!) {
        articleCreate(article: $article) {
          article { id handle }
          userErrors { message }
        }
      }
    `,
    {
      article: {
        blogId: input.blogId,
        title: input.title,
        handle: input.slug,
        body: html,
        summary: input.description,
        isPublished: true,
      },
    },
  );

  const error = data.articleCreate.userErrors[0];
  if (error || !data.articleCreate.article) {
    throw new ShopifyApiError(error?.message || "Shopify publish failed", 400);
  }

  return {
    remoteId: data.articleCreate.article.id,
    liveUrl: `https://${domain}/blogs/${input.blogHandle}/${data.articleCreate.article.handle}`,
  };
}
