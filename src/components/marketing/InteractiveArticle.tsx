"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { GeoPlaybookSection } from "@/components/marketing/GeoPlaybookSection";
import {
  useReadTimeTracker,
  type ReadTimeTrackerState,
} from "@/hooks/useReadTimeTracker";
import { downloadGeoPlaybook } from "@/lib/marketing/geo-playbook";

const ARTICLE_WORD_COUNT = 2200;

const NURTURE_SEQUENCE_ID = "nurture-sequence";
const PLAYBOOK_SECTION_ID = "geo-playbook";

const SECTIONS = [
  { id: NURTURE_SEQUENCE_ID, label: "Email sequence" },
  { id: "nurture-email-1", label: "Email 1 · Welcome" },
  { id: "nurture-email-2", label: "Email 2 · Citation gap" },
  { id: "nurture-email-3", label: "Email 3 · Audit CTA" },
  { id: PLAYBOOK_SECTION_ID, label: "GEO Playbook" },
  { id: "geo-curriculum", label: "Curriculum" },
  { id: "geo-module-1", label: "1. RAG era" },
  { id: "geo-module-2", label: "2. Money prompts" },
  { id: "geo-module-3", label: "3. GEO audit" },
  { id: "geo-module-4", label: "4. Attribution" },
  { id: "geo-landing", label: "Value props" },
  { id: "geo-capture", label: "Get playbook" },
] as const;

function scrollToPlaybook(updateUrl = true) {
  const el = document.getElementById(PLAYBOOK_SECTION_ID);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  if (updateUrl) {
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}#${PLAYBOOK_SECTION_ID}`,
    );
  }
}

const EMAILS = [
  {
    id: "nurture-email-1",
    number: 1,
    title: "Warm Welcome & High Value Hook",
    subject: "Stop optimizing for dead blue links (GEO Playbook inside)",
    preview:
      "Why traditional SEO is losing 60%+ of high-intent search traffic to AI engines, and how to claim your brand's citation space today.",
    cta: {
      label: "Download the GEO Strategy Playbook",
      href: `#${PLAYBOOK_SECTION_ID}`,
      downloadPlaybook: true,
    },
    teaser: "In our next email, we'll dive into the exact citation gaps that are silently leaking your pipeline to competitors.",
  },
  {
    id: "nurture-email-2",
    number: 2,
    title: "Problem & Solution Narrative",
    subject: "Your competitors are answering ChatGPT prompts. Are you?",
    preview:
      "The hidden gap between your search rankings and your actual pipeline revenue.",
    cta: { label: "Run Your First Money Prompt Audit", href: "/audit" },
    teaser: null,
  },
  {
    id: "nurture-email-3",
    number: 3,
    title: "Urgent Call-to-Action / Offer",
    subject: "Your 60-Second Citation Audit is waiting (Bonus inside)",
    preview:
      "See exactly where your brand is cited in AI search results. Get your custom GEO report before our weekly capacity limit resets.",
    cta: { label: "Run My 60-Second Free Citation Audit", href: "/audit" },
    teaser: null,
  },
] as const;

const EXAMPLE_PROMPTS = [
  "What is the best enterprise CRM for mid-market manufacturing?",
  "Which SOC-2 compliance software has the fastest onboarding?",
] as const;

const CITE_PILOT_FEATURES = [
  {
    title: "Money Prompt Tracking",
    body: "We monitor the exact prompts your buyers use, across all major AI engines.",
  },
  {
    title: "Real-Time Citation Audits",
    body: "Pinpoint exactly why you were excluded and which sources the LLM trusted instead.",
  },
  {
    title: "Automated Remediation",
    body: "Get clear, actionable workflows to update your digital footprint so LLMs reference your product on autopilot.",
  },
] as const;

const AUDIT_BULLETS = [
  "Where your brand is being cited for high-intent money prompts.",
  "Which of your direct competitors are stealing your share-of-voice.",
  "The exact steps required to claim your missing citations.",
] as const;

function ReadTimeRail({
  tracker,
  sections,
}: {
  tracker: ReadTimeTrackerState;
  sections: readonly { id: string; label: string }[];
}) {
  const circumference = 2 * Math.PI * 18;
  const offset = circumference * (1 - tracker.progress);

  return (
    <aside
      className="sticky top-24 hidden shrink-0 lg:block lg:w-56"
      aria-label="Reading progress"
    >
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <svg
            className="h-12 w-12 -rotate-90"
            viewBox="0 0 40 40"
            aria-hidden
          >
            <circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              className="stroke-border"
              strokeWidth="3"
            />
            <circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              className="stroke-accent transition-[stroke-dashoffset] duration-300"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Read time
            </p>
            <p className="font-display text-lg font-bold text-ink">
              {tracker.minutes} min
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted">
          <span className="font-semibold text-ink">{tracker.percentRead}%</span>{" "}
          complete
          {tracker.minutesLeft > 0 && (
            <>
              {" "}
              · ~{tracker.minutesLeft} min left
            </>
          )}
        </p>
        {tracker.activeSectionLabel && (
          <p className="mt-2 truncate text-xs text-muted">
            Now:{" "}
            <span className="font-medium text-ink">
              {tracker.activeSectionLabel}
            </span>
          </p>
        )}
        <nav className="mt-4 space-y-1 border-t border-border pt-3">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`block truncate rounded-lg px-2 py-1 text-xs transition ${
                tracker.activeSectionId === s.id
                  ? "bg-accent/10 font-medium text-accent"
                  : "text-muted hover:bg-white hover:text-ink"
              }`}
            >
              {s.label}
            </a>
          ))}
        </nav>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300"
            style={{ width: `${tracker.percentRead}%` }}
          />
        </div>
      </div>
    </aside>
  );
}

function MobileReadBar({ tracker }: { tracker: ReadTimeTrackerState }) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur lg:hidden"
      role="progressbar"
      aria-valuenow={tracker.percentRead}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
    >
      <div
        className="h-1 bg-accent transition-[width] duration-300"
        style={{ width: `${tracker.percentRead}%` }}
      />
      <div className="flex items-center justify-between px-4 py-2 text-xs text-muted">
        <span>
          {tracker.percentRead}% · {tracker.minutes} min
        </span>
        <span className="truncate pl-4 text-ink">
          {tracker.activeSectionLabel ?? "Growth sequence"}
        </span>
      </div>
    </div>
  );
}

function EmailMeta({
  subject,
  preview,
}: {
  subject: string;
  preview: string;
}) {
  return (
    <div className="border-b border-border bg-surface/80 px-5 py-4 sm:px-6">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span className="rounded-md bg-ink/5 px-2 py-0.5 font-medium text-ink">
          Inbox
        </span>
        <span>Cite Pilot</span>
        <span aria-hidden>·</span>
        <span>to you</span>
      </div>
      <p className="font-display mt-3 text-base font-bold text-ink sm:text-lg">
        {subject}
      </p>
      <p className="mt-1 text-sm text-muted">{preview}</p>
    </div>
  );
}

function EmailSignature() {
  return (
    <div className="border-t border-border/60 pt-5 text-sm text-muted">
      <p>Best,</p>
      <p className="mt-2 font-medium text-ink">The Cite Pilot Team</p>
    </div>
  );
}

function EmailCta({
  label,
  href,
  downloadPlaybook = false,
}: {
  label: string;
  href: string;
  downloadPlaybook?: boolean;
}) {
  const className =
    "mt-6 inline-flex rounded-xl bg-accent px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95";

  if (href.startsWith("#")) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => {
          if (downloadPlaybook) downloadGeoPlaybook();
          scrollToPlaybook();
        }}
      >
        {label}
      </button>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

function EmailCard({
  id,
  number,
  title,
  subject,
  preview,
  cta,
  children,
  teaser,
}: {
  id: string;
  number: number;
  title: string;
  subject: string;
  preview: string;
  cta: { label: string; href: string; downloadPlaybook?: boolean };
  children: ReactNode;
  teaser?: string | null;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/15 font-display text-sm font-bold text-accent">
          {number}
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Email {number}
          </p>
          <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">
            {title}
          </h2>
        </div>
      </div>

      <article className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <EmailMeta subject={subject} preview={preview} />
        <div className="space-y-4 px-5 py-6 text-base leading-relaxed text-muted sm:px-6">
          <p>Hi [First Name],</p>
          {children}
          <EmailCta
            label={cta.label}
            href={cta.href}
            downloadPlaybook={cta.downloadPlaybook}
          />
          {teaser && (
            <p className="text-sm italic text-muted/90">{teaser}</p>
          )}
          <EmailSignature />
        </div>
      </article>
    </section>
  );
}

function EmailOneBody() {
  return (
    <>
      <p>
        Traditional SEO is experiencing a silent extinction event.
      </p>
      <p>
        While search teams celebrate ranking #1 for arbitrary keywords on Google,
        high-intent buyers are skipping search engine result pages entirely.
        Instead, they are asking ChatGPT, Perplexity, and Gemini:
      </p>
      <ul className="space-y-2">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <li
            key={prompt}
            className="rounded-xl border-l-4 border-accent bg-surface px-4 py-3 text-sm italic text-ink"
          >
            &ldquo;{prompt}&rdquo;
          </li>
        ))}
      </ul>
      <p>
        If these engines aren&apos;t citing your brand in their answers, you
        don&apos;t exist to those buyers.
      </p>
      <p>
        At <strong className="text-ink">Cite Pilot</strong>, we don&apos;t track
        blue links. We optimize for{" "}
        <strong className="text-ink">money prompts</strong>—the exact queries
        driving high-value pipelines. To get you started, we&apos;ve put together
        our proprietary{" "}
        <a
          href={`#${PLAYBOOK_SECTION_ID}`}
          className="font-semibold text-accent hover:underline"
        >
          GEO Strategy Playbook: Winning the AI Answer Engine
        </a>
        .
      </p>
      <p className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-ink">
        No fluff, no vanity metrics. Just a technical, step-by-step framework to
        secure your brand&apos;s citations in LLM responses.
      </p>
    </>
  );
}

function EmailTwoBody() {
  return (
    <>
      <p>
        Yesterday, we talked about how AI engines are eating traditional search.
        Today, let&apos;s talk about the hard numbers.
      </p>
      <p>
        We recently analyzed 1,000+ commercial B2B SaaS prompts across GPT-4o and
        Claude 3.5 Sonnet. The results were stark:{" "}
        <strong className="text-ink">
          Over 74% of the industry-leading brands ranking on Google&apos;s Page 1
          were completely omitted from AI-generated recommendations.
        </strong>
      </p>
      <p>
        This is called the{" "}
        <strong className="text-ink">Citation Gap</strong> — see{" "}
        <a href="#geo-module-3" className="font-medium text-accent hover:underline">
          Module 3
        </a>{" "}
        for the technical audit checklist.
      </p>
      <p>
        When high-value prospects ask an LLM for product comparisons, the engine
        synthesizes its answer from obscure developer docs, forum discussions,
        and third-party reviews. If your GEO strategy isn&apos;t actively feeding
        these models the right data structures, you get left out.
      </p>
      <p className="font-medium text-ink">Here is how Cite Pilot solves this:</p>
      <ul className="space-y-3">
        {CITE_PILOT_FEATURES.map((feature) => (
          <li
            key={feature.title}
            className="rounded-xl border border-border bg-surface px-4 py-3"
          >
            <span className="font-display font-bold text-ink">
              {feature.title}:
            </span>{" "}
            <span className="text-sm">{feature.body}</span>
          </li>
        ))}
      </ul>
      <blockquote className="rounded-2xl border border-border bg-ink px-5 py-5 text-white">
        <p className="text-sm leading-relaxed italic text-white/90">
          &ldquo;Within 30 days of deploying Cite Pilot, our SaaS brand went from
          8% share-of-voice in ChatGPT recommendations to 42% on our top 15 money
          prompts. The inbound pipeline growth has been immediate.&rdquo;
        </p>
        <footer className="mt-3 text-xs font-medium text-white/60">
          — Head of Growth, Series-B DevTools Platform
        </footer>
      </blockquote>
      <p className="font-medium text-ink">
        Don&apos;t let your competitors monopolize the AI search interface.
      </p>
    </>
  );
}

function EmailThreeBody() {
  return (
    <>
      <p>
        We&apos;ve covered the shifting landscape and the mechanics of the
        Citation Gap. Now it&apos;s time to stop guessing and start measuring.
      </p>
      <p>
        You can map your entire AI search footprint in less than a minute. Our{" "}
        <strong className="text-ink">60-Second Free Citation Audit</strong> scans
        ChatGPT, Perplexity, and Gemini to show you exactly:
      </p>
      <ol className="space-y-2">
        {AUDIT_BULLETS.map((bullet, i) => (
          <li
            key={bullet}
            className="flex gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
              {i + 1}
            </span>
            <span>{bullet}</span>
          </li>
        ))}
      </ol>
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/80 p-5">
        <p className="font-display font-bold text-ink">
          Limited Time Onboarding Bonus
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          If you run your audit within the next 48 hours, our lead GEO architect
          will record a personalized, 5-minute video teardown of your gap analysis,
          outlining your fastest path to AI citation dominance.
        </p>
        <p className="mt-3 text-sm text-muted">
          We limit these human-curated video teardowns to{" "}
          <strong className="text-ink">50 growth marketers per week</strong> to
          maintain our service quality. Currently, we have{" "}
          <strong className="text-accent">12 slots remaining</strong> for this
          cohort.
        </p>
      </div>
      <p>
        Your pipeline shouldn&apos;t rely on users clicking blue links that
        they&apos;ve already trained themselves to ignore. Claim your AI search
        real estate today.
      </p>
    </>
  );
}

const EMAIL_BODIES = [EmailOneBody, EmailTwoBody, EmailThreeBody] as const;

export function InteractiveArticle() {
  const articleRef = useRef<HTMLElement>(null);
  const tracker = useReadTimeTracker(articleRef, ARTICLE_WORD_COUNT, {
    sections: [...SECTIONS],
  });

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    requestAnimationFrame(() => {
      const el = document.getElementById(hash);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  return (
    <div className="relative pb-16 lg:pb-0">
      <MobileReadBar tracker={tracker} />

      <div className="mx-auto flex max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:px-8">
        <ReadTimeRail tracker={tracker} sections={SECTIONS} />

        <article ref={articleRef} className="min-w-0 flex-1 space-y-14">
          <header className="rounded-3xl border border-border bg-gradient-to-br from-ink via-ink to-accent/30 p-6 text-white sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
              B2B SaaS growth sequence
            </p>
            <h1 className="font-display mt-3 text-3xl font-bold leading-tight sm:text-4xl lg:text-[2.65rem]">
              Dominating the LLM Era
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
              Read the three-email nurture sequence, then explore the full GEO
              Playbook—four modules, landing copy, and a 60-second citation audit
              form.
            </p>
            <nav
              aria-label="Jump to page sections"
              className="mt-6 flex flex-wrap gap-2"
            >
              <a
                href={`#${NURTURE_SEQUENCE_ID}`}
                className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
              >
                Email sequence
              </a>
              <a
                href={`#${PLAYBOOK_SECTION_ID}`}
                className="rounded-full border border-accent/50 bg-accent/25 px-4 py-2 text-sm font-medium text-white transition hover:bg-accent/35"
              >
                GEO Playbook
              </a>
              <a
                href="#geo-capture"
                className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
              >
                Get playbook + audit
              </a>
            </nav>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white/90">
                {tracker.minutes} min read
              </span>
              <span className="rounded-full border border-accent/40 bg-accent/20 px-3 py-1 font-medium text-white">
                3 emails + playbook
              </span>
            </div>
          </header>

          <nav
            aria-label="Page overview"
            className="rounded-2xl border border-border bg-surface p-6 sm:p-8"
          >
            <h2 className="font-display text-lg font-bold text-ink">
              On this page
            </h2>
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                  Growth emails
                </p>
                <ol className="mt-3 space-y-2">
                  {EMAILS.map((email) => (
                    <li key={email.id}>
                      <a
                        href={`#${email.id}`}
                        className="group flex gap-3 rounded-xl border border-border bg-white p-3 text-sm shadow-sm transition hover:border-accent/40"
                      >
                        <span className="font-bold text-accent">
                          {email.number}.
                        </span>
                        <span className="min-w-0">
                          <span className="font-medium text-ink group-hover:text-accent">
                            {email.title}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-muted">
                            {email.subject}
                          </span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                  GEO Playbook
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>
                    <a
                      href={`#${PLAYBOOK_SECTION_ID}`}
                      className="font-medium text-ink transition hover:text-accent"
                    >
                      Playbook title &amp; download
                    </a>
                  </li>
                  <li>
                    <a
                      href="#geo-curriculum"
                      className="font-medium text-ink transition hover:text-accent"
                    >
                      4-module curriculum
                    </a>
                  </li>
                  <li>
                    <a
                      href="#geo-landing"
                      className="font-medium text-ink transition hover:text-accent"
                    >
                      Landing page value props
                    </a>
                  </li>
                  <li>
                    <a
                      href="#geo-capture"
                      className="font-medium text-ink transition hover:text-accent"
                    >
                      Lead capture + audit
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </nav>

          <section id={NURTURE_SEQUENCE_ID} className="scroll-mt-28 space-y-14">
            <div className="rounded-2xl border border-dashed border-border bg-white/60 px-5 py-4 text-center text-sm text-muted">
              <strong className="text-ink">Email nurture sequence</strong> — Email
              1 links to the{" "}
              <a
                href={`#${PLAYBOOK_SECTION_ID}`}
                className="font-medium text-accent hover:underline"
              >
                GEO Playbook
              </a>{" "}
              below.
            </div>

          {EMAILS.map((email, i) => {
            const Body = EMAIL_BODIES[i]!;
            return (
              <EmailCard
                key={email.id}
                id={email.id}
                number={email.number}
                title={email.title}
                subject={email.subject}
                preview={email.preview}
                cta={email.cta}
                teaser={email.teaser}
              >
                <Body />
              </EmailCard>
            );
          })}
          </section>

          <div className="rounded-2xl border border-accent/30 bg-accent/5 px-5 py-4 text-center text-sm text-muted">
            <strong className="text-ink">GEO Playbook</strong> — referenced in
            Email 1.{" "}
            <a
              href={`#${PLAYBOOK_SECTION_ID}`}
              className="font-medium text-accent hover:underline"
            >
              Jump to playbook
            </a>{" "}
            or{" "}
            <a href="#geo-capture" className="font-medium text-accent hover:underline">
              skip to the audit form
            </a>
            .
          </div>

          <GeoPlaybookSection />
        </article>
      </div>
    </div>
  );
}
