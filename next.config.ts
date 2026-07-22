import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";
import { createRequire } from "node:module";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const require = createRequire(import.meta.url);

function withOptionalBundleAnalyzer(config: NextConfig): NextConfig {
  if (process.env.ANALYZE !== "true") return config;
  try {
    const bundleAnalyzer = require("@next/bundle-analyzer") as (
      opts: { enabled: boolean },
    ) => (c: NextConfig) => NextConfig;
    return bundleAnalyzer({ enabled: true })(config);
  } catch {
    console.warn(
      "[next.config] @next/bundle-analyzer not installed — skipping ANALYZE",
    );
    return config;
  }
}

const marketingCacheControl =
  "public, s-maxage=3600, stale-while-revalidate=86400";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://plausible.io https://*.vercel-scripts.com https://*.i.posthog.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      [
        "connect-src 'self'",
        "https://plausible.io",
        "https://*.neon.tech",
        "https://*.supabase.co",
        "https://*.i.posthog.com",
        "https://*.ingest.sentry.io",
        "https://api.stripe.com",
        "https://checkout.stripe.com",
      ].join(" "),
      "frame-src 'self' https://js.stripe.com https://checkout.stripe.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    const previewCsp = securityHeaders.map((header) =>
      header.key === "Content-Security-Policy"
        ? {
            ...header,
            value: header.value.replace("frame-ancestors 'none'", "frame-ancestors 'self'"),
          }
        : header,
    );

    return [
      {
        source: "/report/proof/preview",
        headers: previewCsp,
      },
      {
        source: "/",
        headers: [{ key: "Cache-Control", value: marketingCacheControl }],
      },
      {
        source: "/:locale(en|es|fr)",
        headers: [{ key: "Cache-Control", value: marketingCacheControl }],
      },
      {
        source: "/pricing",
        headers: [{ key: "Cache-Control", value: marketingCacheControl }],
      },
      {
        source: "/:locale(en|es|fr)/pricing",
        headers: [{ key: "Cache-Control", value: marketingCacheControl }],
      },
      {
        source: "/agency",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/:locale(en|es|fr)/agency",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/blog",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=1800, stale-while-revalidate=7200",
          },
        ],
      },
      {
        source: "/blog/:slug*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/launch",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
      {
        source: "/press",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/api/og/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/api-docs",
        destination: "/docs/api",
        permanent: true,
      },
      {
        source: "/dashboard/admin",
        destination: "/admin",
        permanent: false,
      },
      {
        source: "/admin/login",
        destination: "/auth/sign-in?from=/admin",
        permanent: false,
      },
      {
        source: "/nurture",
        destination: "/tools/geo-playbook",
        permanent: true,
      },
      {
        source: "/nurture/:path*",
        destination: "/tools/geo-playbook/:path*",
        permanent: true,
      },
      {
        source: "/agencies",
        destination: "/agency",
        permanent: true,
      },
      {
        source: "/vs/:slug",
        destination: "/compare/:slug",
        permanent: true,
      },
      {
        source: "/compare/vs-:slug",
        destination: "/compare/:slug",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/geo/:workspaceId.js",
        destination: "/geo/:workspaceId",
      },
    ];
  },
};

export default withSentryConfig(
  withOptionalBundleAnalyzer(withNextIntl(nextConfig)),
  {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    silent: !process.env.CI,
    widenClientFileUpload: true,
  },
);
