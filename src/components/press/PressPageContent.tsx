"use client";

import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { MarketingDarkHero } from "@/components/marketing/MarketingDarkHero";
import { CopyButton } from "@/components/press/CopyButton";
import { Container } from "@/components/ui/Container";
import {
  pressCoverage,
  pressFounderBio,
  pressJournalistFaqs,
  pressKeyFacts,
  pressLogoAssets,
  pressOneLiner,
  pressScreenshots,
  pressShortParagraph,
  pressEmail,
} from "@/lib/press/content";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-white/10 py-14 md:py-16">
      <h2 className="font-display text-2xl font-bold text-white md:text-3xl">{title}</h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}

function CopyBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">{label}</p>
        <CopyButton text={text} />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-white/75 md:text-base">{text}</p>
    </div>
  );
}

function DownloadLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      download
      className={`inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-accent/40 hover:bg-accent/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${className}`}
    >
      {children}
    </a>
  );
}

export function PressPageContent() {
  const founder = pressFounderBio();

  return (
    <>
      <Header light overlay />
      <main id="main-content" tabIndex={-1} className="bg-[#04060c]">
        <MarketingDarkHero
          eyebrow="Media"
          title="Press & Media Kit"
          description="Everything you need to write about CitePilot."
        >
          <p className="mt-4 text-sm text-white/55">
            Press contact:{" "}
            <a
              href={`mailto:${pressEmail}`}
              className="font-semibold text-glow underline decoration-white/20 underline-offset-2 hover:text-white"
            >
              {pressEmail}
            </a>
          </p>
        </MarketingDarkHero>

        <Container className="pb-16 text-white">
          <nav
            aria-label="Press page sections"
            className="flex flex-wrap gap-2 border-b border-white/10 pb-8"
          >
            {[
              ["about", "About"],
              ["logos", "Logos"],
              ["screenshots", "Screenshots"],
              ["founder", "Founder"],
              ["faq", "Journalist FAQ"],
            ].map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:border-accent/40 hover:text-white"
              >
                {label}
              </a>
            ))}
          </nav>

          <Section id="about" title="About CitePilot">
            <div className="space-y-4">
              <CopyBlock label="One-liner" text={pressOneLiner} />
              <CopyBlock label="Short paragraph (~150 words)" text={pressShortParagraph} />
            </div>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {pressKeyFacts.map((fact) => (
                <li
                  key={fact.label}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-white/45">
                    {fact.label}
                  </span>
                  <p className="mt-1 text-sm font-medium text-white/85">{fact.value}</p>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="logos" title="Logo downloads">
            <p className="mb-6 text-sm text-white/55">
              Don&apos;t modify. Use on white or dark backgrounds only.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {pressLogoAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="flex min-h-[72px] items-center justify-center rounded-xl bg-white/5 p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={asset.svg} alt={asset.label} className="max-h-14 w-auto" />
                  </div>
                  <p className="text-sm font-semibold text-white/90">{asset.label}</p>
                  <div className="flex flex-wrap gap-2">
                    <DownloadLink href={asset.svg}>SVG</DownloadLink>
                    <DownloadLink href={asset.png}>PNG</DownloadLink>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <a
                href="/api/press/download/brand-assets"
                className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                Download all as ZIP →
              </a>
            </div>
          </Section>

          <Section id="screenshots" title="Product screenshots">
            <div className="grid gap-6 md:grid-cols-2">
              {pressScreenshots.map((shot) => (
                <figure
                  key={shot.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
                >
                  <div className="relative aspect-[1270/760] w-full bg-[#0c1512]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={shot.image}
                      alt={shot.caption}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <figcaption className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-white/70">{shot.caption}</p>
                    <DownloadLink href={shot.image}>Download PNG</DownloadLink>
                  </figcaption>
                </figure>
              ))}
            </div>
            <div className="mt-8">
              <a
                href="/api/press/download/screenshots"
                className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                Download all screenshots ZIP →
              </a>
            </div>
          </Section>

          <Section id="founder" title="Founder">
            <div className="flex flex-col gap-8 md:flex-row md:items-start">
              <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-full border border-white/15 bg-white/5">
                <Image
                  src={founder.photo}
                  alt={founder.name}
                  fill
                  className="object-cover"
                  sizes="160px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-xl font-bold text-white">{founder.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/70">{founder.bio}</p>
                <p className="mt-4 text-sm text-white/55">
                  Available for: <span className="text-white/80">{founder.availableFor}</span>
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={founder.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-glow hover:underline"
                  >
                    Twitter / X
                  </Link>
                  <Link
                    href={founder.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-glow hover:underline"
                  >
                    LinkedIn
                  </Link>
                  <a
                    href={`mailto:${pressEmail}`}
                    className="text-sm font-semibold text-glow hover:underline"
                  >
                    {pressEmail}
                  </a>
                </div>
              </div>
            </div>
          </Section>

          <Section id="faq" title="Quick facts for journalists">
            <div className="space-y-4">
              {pressJournalistFaqs.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <summary className="cursor-pointer list-none text-base font-semibold text-white marker:content-none">
                    {item.question}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">{item.answer}</p>
                </details>
              ))}
            </div>
          </Section>

          {pressCoverage.length > 0 && (
            <Section id="coverage" title="Recent coverage">
              <ul className="space-y-3">
                {pressCoverage.map((item) => (
                  <li key={item.url}>
                    <Link
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-glow hover:underline"
                    >
                      {item.title}
                    </Link>
                    <span className="text-sm text-white/45"> — {item.outlet}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </Container>
      </main>
    </>
  );
}
