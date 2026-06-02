"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";
import {
  useReadTimeTracker,
  type ReadTimeTrackerState,
} from "@/hooks/useReadTimeTracker";

const ARTICLE_WORD_COUNT = 720;

const SECTIONS = [
  { id: "email-1", label: "Email 1" },
  { id: "email-2", label: "Email 2" },
  { id: "email-3", label: "Email 3" },
] as const;

type EmailBlock = {
  id: string;
  sequence: number;
  name: string;
  subject: string;
  preview: string;
  children: ReactNode;
};

function ReadTimeRail({ tracker }: { tracker: ReadTimeTrackerState }) {
  const circumference = 2 * Math.PI * 18;
  const offset = circumference * (1 - tracker.progress);

  return (
    <aside
      className="sticky top-24 hidden shrink-0 lg:block lg:w-52"
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
          {SECTIONS.map((s) => (
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
          {tracker.activeSectionLabel ?? "Nurture sequence"}
        </span>
      </div>
    </div>
  );
}

function EmailCta({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition";
  const styles =
    variant === "primary"
      ? "bg-accent text-white shadow-sm hover:opacity-95"
      : "border border-border bg-white text-ink hover:border-accent/40";

  return (
    <Link href={href} className={`${base} ${styles}`}>
      {children}
    </Link>
  );
}

function EmailCard({
  block,
  firstName,
}: {
  block: EmailBlock;
  firstName: string;
}) {
  return (
    <article
      id={block.id}
      className="scroll-mt-28 overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
    >
      <div className="border-b border-border bg-gradient-to-r from-ink to-ink/90 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-sm font-bold text-accent">
            {block.sequence}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-white/50">
              {block.name}
            </p>
            <p className="truncate font-display text-sm font-bold text-white sm:text-base">
              {block.subject}
            </p>
          </div>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-white/60 sm:text-sm">
          <span className="font-medium text-white/80">Preview: </span>
          {block.preview}
        </p>
      </div>

      <div className="p-5 sm:p-8">
        <p className="text-sm text-muted">
          Hi <span className="font-semibold text-ink">{firstName}</span>,
        </p>
        <div className="mt-4 space-y-4 text-base leading-relaxed text-muted">
          {block.children}
        </div>
        <p className="mt-8 text-sm text-muted">
          To your growth on autopilot,
        </p>
        <p className="mt-1 font-display font-bold text-ink">
          The Cite Pilot Team
        </p>
      </div>
    </article>
  );
}

export type InteractiveArticleProps = {
  firstName?: string;
};

export function InteractiveArticle({
  firstName = "there",
}: InteractiveArticleProps) {
  const articleRef = useRef<HTMLElement>(null);
  const tracker = useReadTimeTracker(articleRef, ARTICLE_WORD_COUNT, {
    sections: [...SECTIONS],
  });

  const emails: EmailBlock[] = [
    {
      id: "email-1",
      sequence: 1,
      name: "The paradigm shift (warm welcome)",
      subject: "Your SEO strategy has a massive blindspot",
      preview:
        "Over 40% of B2B SaaS queries are now answered directly by LLMs. Here is where your traffic went—and how to claim it back.",
      children: (
        <>
          <p>
            If you are still measuring organic growth solely by your Google
            keyword rankings, you are optimizing for a search landscape that is
            rapidly disappearing.
          </p>
          <p>
            B2B buyers have changed how they research. Instead of scrolling
            through pages of blue links, they are asking ChatGPT, Perplexity,
            and Google AI Overviews directly:{" "}
            <em className="text-ink">
              &ldquo;What are the best enterprise alternatives to HubSpot?&rdquo;
            </em>{" "}
            or{" "}
            <em className="text-ink">
              &ldquo;Which billing APIs support multi-tenant billing?&rdquo;
            </em>
          </p>
          <p>
            If your SaaS isn&apos;t cited inside those generated answers, you
            simply do not exist to those prospects.
          </p>
          <p>
            At <strong className="text-ink">Cite Pilot</strong>, we built the
            world&apos;s first closed-loop citation intelligence platform to help
            growth teams monitor their &ldquo;money prompts&rdquo; and
            systematically secure dominant visibility inside generative search
            engines.
          </p>
          <p>
            To get you started, we have processed a customized framework for your
            team.
          </p>
          <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-4">
            <p className="font-semibold text-ink">
              Download the GEO Checklist
            </p>
            <p className="mt-1 text-sm">
              We&apos;ve packaged the exact structural and content optimizations
              required to make your site indexable by LLM web-crawlers.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
            <EmailCta href="/audit?ref=geo-checklist">
              Get the GEO Checklist
            </EmailCta>
            <EmailCta href="/audit" variant="secondary">
              Run Your Free Citation Audit
            </EmailCta>
          </div>
          <p className="text-sm">
            But don&apos;t stop at theory. You need to know where you stand
            today. Use our free tool to run an instant diagnostic on your
            brand&apos;s current AI footprint.
          </p>
        </>
      ),
    },
    {
      id: "email-2",
      sequence: 2,
      name: "The money prompt opportunity",
      subject: 'The "money prompts" your competitors are winning',
      preview:
        "When high-intent buyers ask Perplexity for recommendations, who gets the citation? Let's look at the data.",
      children: (
        <>
          <p>
            Every day, enterprise decision-makers enter high-intent
            &ldquo;money prompts&rdquo; into AI search engines. They aren&apos;t
            looking for blog posts; they are looking for a shortlist of vendors.
          </p>
          <p>Most B2B SaaS growth teams have two major blindspots:</p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              They have no idea which AI engines are recommending them.
            </li>
            <li>
              They do not know what structural content fixes are needed to force
              LLMs to cite them.
            </li>
          </ol>
          <p>
            Without continuous monitoring, you are blind to your brand&apos;s AI
            market share.
          </p>
          <p className="font-semibold text-ink">Here is how Cite Pilot solves this:</p>
          <ul className="space-y-3">
            <li className="flex gap-3 rounded-lg border border-border bg-surface px-4 py-3">
              <span className="text-accent" aria-hidden>
                ●
              </span>
              <span>
                <strong className="text-ink">Real-time Prompts Tracking:</strong>{" "}
                We monitor ChatGPT, Perplexity, and Google AIO daily for your
                core industry money prompts.
              </span>
            </li>
            <li className="flex gap-3 rounded-lg border border-border bg-surface px-4 py-3">
              <span className="text-accent" aria-hidden>
                ●
              </span>
              <span>
                <strong className="text-ink">Actionable Workflows:</strong> We
                pinpoint the exact content changes (structured data, semantic
                tables, citation anchors) to secure your spot.
              </span>
            </li>
            <li className="flex gap-3 rounded-lg border border-border bg-surface px-4 py-3">
              <span className="text-accent" aria-hidden>
                ●
              </span>
              <span>
                <strong className="text-ink">Citation Lift Attribution:</strong> We
                prove your visibility increase with hard, verifiable data—not
                opaque legacy SEO scores.
              </span>
            </li>
          </ul>
          <blockquote className="border-l-4 border-accent bg-surface/80 px-4 py-4 italic text-ink">
            <p className="text-sm leading-relaxed">
              &ldquo;Within 30 days of deploying Cite Pilot&apos;s recommended
              structured changes, our tool was cited in 80% of Perplexity queries
              for &apos;top developer security platforms&apos;. Our organic lead
              volume spiked by 34%.&rdquo;
            </p>
            <footer className="mt-3 text-xs font-semibold not-italic text-muted">
              — Sarah K., VP of Growth at SecureStack
            </footer>
          </blockquote>
          <p>
            Ready to see which high-intent queries your competitors are currently
            monopolizing?
          </p>
          <div className="pt-2">
            <EmailCta href="/audit?ref=competitor-citations">
              Audit Your Competitors&apos; Citations
            </EmailCta>
          </div>
        </>
      ),
    },
    {
      id: "email-3",
      sequence: 3,
      name: "The closing window (urgent offer)",
      subject: "Stop being filtered out by AI (Exclusive Pioneer Offer)",
      preview:
        "Claim your brand's share of generative search traffic before your competitors lock down the premium citations.",
      children: (
        <>
          <p>
            LLMs are trained on historical data, semantic relationships, and
            trusted structural real estate. Once a competitor establishes
            dominance inside the core citation graph for your industry&apos;s
            &ldquo;money prompts,&rdquo; displacing them becomes exponentially
            harder.
          </p>
          <p>
            The window to claim prime real estate in ChatGPT, Perplexity, and
            Google AI Overviews is open right now—but it is closing fast.
          </p>
          <p>
            You have run your initial Citation Audit. Now, it is time to put your
            generative visibility on complete autopilot.
          </p>
          <div className="rounded-xl border-2 border-accent/30 bg-gradient-to-br from-accent/10 to-white p-5">
            <p className="font-display font-bold text-ink">
              Pioneer Growth Package — next 48 hours
            </p>
            <p className="mt-1 text-sm">
              For forward-thinking SaaS teams:
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex gap-2">
                <span className="font-bold text-accent" aria-hidden>
                  ✓
                </span>
                <span>
                  <strong className="text-ink">Full Cite Pilot Pro Access:</strong>{" "}
                  Monitor up to 250 priority money prompts daily (50% off your
                  first 3 months).
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-accent" aria-hidden>
                  ✓
                </span>
                <span>
                  <strong className="text-ink">Weekly Citation Lift Audits:</strong>{" "}
                  Automated alerts whenever a competitor displaces your brand.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-accent" aria-hidden>
                  ✓
                </span>
                <span>
                  <strong className="text-ink">Bonus:</strong> A 1-on-1 GEO Strategy
                  Session with our lead citation engineer to review your
                  site&apos;s LLM crawlability.
                </span>
              </li>
            </ul>
          </div>
          <p>
            Don&apos;t let legacy SEO tools keep you blindfolded while your organic
            pipeline migrates to generative AI.
          </p>
          <div className="pt-2">
            <EmailCta href="/pricing?ref=pioneer-50">
              Upgrade to Cite Pilot Pro (Save 50%)
            </EmailCta>
          </div>
        </>
      ),
    },
  ];

  return (
    <div className="relative pb-16 lg:pb-0">
      <MobileReadBar tracker={tracker} />

      <div className="mx-auto flex max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:px-8">
        <ReadTimeRail tracker={tracker} />

        <article ref={articleRef} className="min-w-0 flex-1 space-y-10">
          <header className="rounded-3xl border border-border bg-gradient-to-br from-surface via-white to-accent/5 p-6 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">
              Nurture sequence preview
            </p>
            <h1 className="font-display mt-3 text-3xl font-bold leading-tight text-ink sm:text-4xl">
              GEO onboarding email series
            </h1>
            <p className="mt-3 max-w-2xl text-muted">
              Three high-conversion emails guiding prospects from awareness to
              audit to upgrade—personalized for{" "}
              <span className="font-semibold text-ink">{firstName}</span>.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full border border-border bg-white px-3 py-1 text-muted">
                {tracker.minutes} min read
              </span>
              <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-medium text-accent">
                3 emails · PLG funnel
              </span>
            </div>
          </header>

          <div className="space-y-12">
            {emails.map((block) => (
              <EmailCard key={block.id} block={block} firstName={firstName} />
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
