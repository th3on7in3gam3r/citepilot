import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { AnalyticsScripts } from "@/components/analytics/AnalyticsScripts";
import { CookieConsentBanner } from "@/components/analytics/CookieConsentBanner";
import { ReferralRefCapture } from "@/components/referrals/ReferralRefCapture";
import { AppProviders } from "@/components/providers/AppProviders";
import { clampMetaDescription } from "@/lib/seo/meta";
import { site } from "@/lib/site";
import "./globals.css";

const homeDescription = clampMetaDescription(site.description);

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  fallback: [
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
  fallback: [
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  alternates: { canonical: site.url },
  title: {
    default: site.homeTitle,
    template: `%s · ${site.name}`,
  },
  description: homeDescription,
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/images/branding/citepilot-icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: site.homeTitle,
    description: homeDescription,
    type: "website",
    url: site.url,
    siteName: site.name,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: site.homeTitle,
    description: homeDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakarta.variable} h-full scroll-smooth antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://plausible.io" />
        <link rel="preconnect" href="https://us.i.posthog.com" />
        <link rel="dns-prefetch" href="https://api.stripe.com" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://checkout.stripe.com" />
      </head>
      <body className="flex min-h-full flex-col bg-white text-ink">
        <AnalyticsScripts />
        <ReferralRefCapture />
        <AppProviders>{children}</AppProviders>
        <CookieConsentBanner />
      </body>
    </html>
  );
}
