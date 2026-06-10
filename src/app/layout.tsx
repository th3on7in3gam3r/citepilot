import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { AnalyticsScripts } from "@/components/analytics/AnalyticsScripts";
import { AppProviders } from "@/components/providers/AppProviders";
import { clampMetaDescription } from "@/lib/seo/meta";
import { site } from "@/lib/site";
import "./globals.css";

const homeDescription = clampMetaDescription(site.description);

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.homeTitle,
    template: `%s · ${site.name}`,
  },
  description: homeDescription,
  icons: {
    icon: [
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
    images: [
      {
        url: "/images/branding/citepilot-logo-full.png",
        width: 1200,
        height: 630,
        alt: `${site.name} — citation tracking for AI search`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: site.homeTitle,
    description: homeDescription,
    images: ["/images/branding/citepilot-logo-full.png"],
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
      <body className="flex min-h-full flex-col bg-white text-ink">
        <AnalyticsScripts />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
