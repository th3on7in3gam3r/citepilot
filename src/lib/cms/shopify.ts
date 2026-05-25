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

async function shopifyGraphql<T>(
  credentials: ShopifyCredentials,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const domain = normalizeShopDomain(credentials.shopDomain);
  const res = await fetch(`https://${domain}/admin/api/2026-04/graphql.json`, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": credentials.accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = (await res.json().catch(() => ({}))) as {
    data?: T;
    errors?: { message?: string }[];
  };
  if (!res.ok || body.errors?.length) {
    const message =
      body.errors?.[0]?.message || `Shopify request failed (${res.status})`;
    throw new ShopifyApiError(message, res.status);
  }
  return body.data as T;
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
