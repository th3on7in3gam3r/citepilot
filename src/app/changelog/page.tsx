import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MarketingDarkHero } from "@/components/marketing/MarketingDarkHero";
import { Container } from "@/components/ui/Container";
import {
  changelogEntries,
  roadmapItems,
} from "@/lib/marketing/changelog";
import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import type { Metadata } from "next";

const title = "Changelog & Roadmap";
const description =
  "What we ship and what's next. CitePilot is actively maintained — weekly citation monitoring, CMS publish, Fleet API, and more.";

export const metadata: Metadata = {
  title: clampSeoTitle(title),
  description: clampMetaDescription(description),
  alternates: { canonical: "/changelog" },
  openGraph: {
    title: `${title} | CitePilot`,
    description: clampMetaDescription(description),
    url: "/changelog",
    type: "website",
  },
};

const statusStyles = {
  shipped: "bg-mint/20 text-mint",
  in_progress: "bg-accent/20 text-glow",
  planned: "bg-white/10 text-white/50",
} as const;

const statusLabels = {
  shipped: "Shipped",
  in_progress: "In progress",
  planned: "Planned",
} as const;

export default function ChangelogPage() {
  return (
    <>
      <Header light overlay />
      <main className="bg-[#04060c]">
        <MarketingDarkHero
          eyebrow="Product updates"
          title="Changelog & roadmap"
          description={description}
        />

        <Container className="py-14 md:py-20">
          <div className="mx-auto grid max-w-5xl gap-14 lg:grid-cols-[1fr_280px]">
            <section aria-labelledby="changelog-heading">
              <h2
                id="changelog-heading"
                className="font-display text-xl font-bold text-white"
              >
                Changelog
              </h2>
              <ol className="mt-8 space-y-8">
                {changelogEntries.map((entry) => (
                  <li
                    key={entry.date}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <time
                        dateTime={entry.date}
                        className="text-sm font-semibold text-glow"
                      >
                        {entry.date}
                      </time>
                      {entry.version && (
                        <span className="font-mono text-xs text-white/40">
                          v{entry.version}
                        </span>
                      )}
                    </div>
                    <h3 className="font-display mt-2 text-lg font-bold text-white">
                      {entry.title}
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {entry.items.map((item) => (
                        <li
                          key={item}
                          className="flex gap-2 text-sm text-white/65"
                        >
                          <span className="shrink-0 text-glow">·</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </section>

            <aside>
              <h2 className="font-display text-lg font-bold text-white">
                Roadmap
              </h2>
              <ul className="mt-6 space-y-3">
                {roadmapItems.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                  >
                    <span
                      className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusStyles[item.status]}`}
                    >
                      {statusLabels[item.status]}
                    </span>
                    <span className="text-sm text-white/70">{item.label}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-xs text-white/40">
                Request a feature via{" "}
                <Link
                  href="mailto:hello@getcitepilot.com"
                  className="text-white/55 underline"
                >
                  hello@getcitepilot.com
                </Link>
              </p>
            </aside>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
