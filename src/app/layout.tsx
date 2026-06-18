import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { AnalyticsScripts } from "@/components/analytics/AnalyticsScripts";
import { CookieConsentBanner } from "@/components/analytics/CookieConsentBanner";
import { ReferralRefCapture } from "@/components/referrals/ReferralRefCapture";
import { ProductHuntUtmCapture } from "@/components/launch/ProductHuntUtmCapture";
import { BadgeRefCapture } from "@/components/widget/BadgeRefCapture";
import { SkipToContent } from "@/components/accessibility/SkipToContent";
import { AppProviders } from "@/components/providers/AppProviders";
import { pickClientMessages } from "@/lib/i18n/client-messages";
import { clampMetaDescription } from "@/lib/seo/meta";
import { site } from "@/lib/site";
import { themeInitScript } from "@/lib/theme";
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
  metadataBase: new URL(site.wwwUrl),
  alternates: { canonical: site.wwwUrl },
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
    url: site.wwwUrl,
    siteName: site.name,
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "CitePilot — track citations in AI answers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: site.homeTitle,
    description: homeDescription,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = pickClientMessages(await getMessages());

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${plusJakarta.variable} h-full scroll-smooth antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preconnect" href="https://plausible.io" />
        <link rel="preconnect" href="https://us.i.posthog.com" />
        <link rel="preconnect" href="https://us-assets.i.posthog.com" />
        <link rel="dns-prefetch" href="https://api.stripe.com" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://checkout.stripe.com" />
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <SkipToContent />
        <AnalyticsScripts />
        <ReferralRefCapture />
        <ProductHuntUtmCapture />
        <BadgeRefCapture />
        <AppProviders>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </AppProviders>
        <CookieConsentBanner />
      </body>
    </html>
  );
}
