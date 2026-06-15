import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

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
    return [
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
        source: "/nurture",
        destination: "/geo-playbook",
        permanent: true,
      },
      {
        source: "/nurture/:path*",
        destination: "/geo-playbook/:path*",
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

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
});
