"use client";

import Link from "next/link";
import { site } from "@/lib/site";

const bullets = [
  "Instant citation check for any site you visit",
  "Green badge when CitePilot has audit data showing AI citations",
  "Platform breakdown: ChatGPT, Perplexity, Google AI Overviews, Gemini",
  "One click to full audit report on getcitepilot.com",
  "Signed-in users see tracked prompts for matching workspaces",
  "Free — no account required for public audit data",
];

function ExtensionPopupMock() {
  const rows = [
    { name: "ChatGPT", cited: true },
    { name: "Perplexity", cited: true },
    { name: "Google AI Overviews", cited: false },
    { name: "Gemini", cited: false },
  ];

  return (
    <div className="mx-auto w-full max-w-[360px] overflow-hidden rounded-2xl border border-white/10 bg-[#0c1220] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#070b14] text-xs font-bold text-accent">
          CP
        </div>
        <div>
          <p className="text-sm font-bold text-white">CitePilot</p>
          <p className="text-xs text-white/50">acme.com</p>
        </div>
        <span className="ml-auto h-2.5 w-2.5 rounded-full bg-mint" aria-hidden />
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-white/50">Citation score</span>
          <strong className="text-2xl font-bold text-accent">72/100</strong>
        </div>
        <p className="text-sm text-white/70">This site appears in AI search citations.</p>
        <ul className="space-y-2">
          {rows.map((row) => (
            <li
              key={row.name}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm"
            >
              <span className="text-white/85">{row.name}</span>
              <span className={row.cited ? "font-semibold text-mint" : "text-white/40"}>
                {row.cited ? "Cited ✓" : "Not cited ✗"}
              </span>
            </li>
          ))}
        </ul>
        <div className="grid gap-2 pt-1">
          <span className="block rounded-full bg-accent py-2.5 text-center text-sm font-bold text-white">
            Full report →
          </span>
          <span className="block rounded-full border border-white/15 py-2.5 text-center text-sm font-semibold text-white/80">
            Get weekly monitoring →
          </span>
        </div>
      </div>
    </div>
  );
}

export function ChromeExtensionPageContent() {
  const storeUrl = process.env.NEXT_PUBLIC_CHROME_WEB_STORE_URL?.trim();

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_360px] lg:items-start">
      <div>
        <ul className="space-y-3">
          {bullets.map((item) => (
            <li key={item} className="flex gap-3 text-sm text-white/75 md:text-base">
              <span className="mt-1 text-accent" aria-hidden>
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          {storeUrl ? (
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-bold text-white hover:bg-accent-deep"
            >
              Add to Chrome — free
            </a>
          ) : (
            <span className="inline-flex items-center justify-center rounded-full bg-accent/80 px-6 py-3 text-sm font-bold text-white">
              Chrome Web Store — coming soon
            </span>
          )}
          <Link
            href="/audit"
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/5"
          >
            Run full audit in browser →
          </Link>
        </div>

        {!storeUrl && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/70">
            <p className="font-semibold text-white">Developer install (until store listing is live)</p>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>Clone the repo and open <code className="text-accent">chrome-extension/</code></li>
              <li>Chrome → Extensions → Developer mode → Load unpacked</li>
              <li>Or run <code className="text-accent">zip -r citepilot-extension.zip chrome-extension/</code> for store upload</li>
            </ol>
          </div>
        )}
      </div>

      <div className="lg:sticky lg:top-28">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-white/40">
          Popup preview
        </p>
        <ExtensionPopupMock />
      </div>
    </div>
  );
}

export function ChromeExtensionInstallJsonLd() {
  const url = `${site.url}/chrome-extension`;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "CitePilot — GEO Citation Checker",
          applicationCategory: "BrowserApplication",
          operatingSystem: "Chrome",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          url,
          description:
            "Chrome extension to see if any website is cited on ChatGPT, Perplexity, and other AI search surfaces.",
          publisher: { "@type": "Organization", name: site.name, url: site.url },
        }),
      }}
    />
  );
}
