"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  useReadTimeTracker,
  type ReadTimeTrackerState,
} from "@/hooks/useReadTimeTracker";
import { joinWaitlist } from "@/lib/client/api";
import { ONBOARDING_STORAGE_KEY } from "@/lib/onboarding";

const ARTICLE_WORD_COUNT = 980;

const SECTIONS = [
  { id: "geo-curriculum", label: "Curriculum" },
  { id: "geo-module-1", label: "1. RAG era" },
  { id: "geo-module-2", label: "2. Money prompts" },
  { id: "geo-module-3", label: "3. GEO audit" },
  { id: "geo-module-4", label: "4. Attribution" },
  { id: "geo-landing", label: "Value props" },
  { id: "geo-capture", label: "Get playbook" },
] as const;

const MODULES = [
  {
    id: "geo-module-1",
    number: 1,
    title: "The Death of the Blue Link & Rise of RAG Architecture",
    topics: [
      {
        label: "The Paradigm Shift",
        body: "Why traditional CTR is collapsing and how Retrieval-Augmented Generation (RAG) models select references.",
      },
      {
        label: "The Mechanics of Citation",
        body: "How LLMs parse trusted data sources, technical docs, and third-party reviews to formulate answers.",
      },
      {
        label: "The Cost of Invisibility",
        body: "What happens when an LLM summarizes your entire category and leaves your brand out of the bulleted recommendations.",
      },
    ],
  },
  {
    id: "geo-module-2",
    number: 2,
    title: "Mapping Your Brand's \"Money Prompts\"",
    topics: [
      {
        label: "Defining Money Prompts",
        body: "Moving past high-volume vanity keywords to capture high-intent commercial prompts (e.g., “What are the best enterprise alternatives to Segment for real-time data orchestration?”).",
      },
      {
        label: "The Intent Matrix",
        body: "Classification of informational, comparative, and transactional prompts utilized by modern B2B buyers.",
      },
      {
        label: "Competitor Siphoning",
        body: "Identifying the prompts where competitors are recommended and building a targeted displacement map.",
      },
    ],
  },
  {
    id: "geo-module-3",
    number: 3,
    title: "The Technical GEO Audit Checklist",
    topics: [
      {
        label: "Structured Data & Semantic Markup",
        body: "Preparing your domain for LLM crawler optimization.",
      },
      {
        label: "The 3rd-Party Authority Loop",
        body: "Uncovering the exact industry databases, directories, and forums Gemini and Perplexity use as trusted ground truths.",
      },
      {
        label: "N-gram Optimization for LLM Tokenizers",
        body: "How phrasing your product's unique value propositions matches LLM semantic embedding spaces.",
      },
    ],
  },
  {
    id: "geo-module-4",
    number: 4,
    title: "Generative Search Attribution & Reporting",
    topics: [
      {
        label: "Calculating Share of Model (SoM)",
        body: "The modern replacement for Share of Voice (SoV).",
      },
      {
        label: "The GEO Pipeline Formula",
        body: "How to attribute pipeline directly back to AI engine recommendations.",
      },
      {
        label: "Building Client-Ready Proof Reports",
        body: "Frameworks for presenting LLM visibility gains to stakeholders and board members.",
      },
    ],
  },
] as const;

const VALUE_BULLETS = [
  {
    title: "Map Your High-Intent Money Prompts",
    body: "Learn to identify and target the exact comparative and transactional queries your actual buyers ask ChatGPT, Claude, and Perplexity.",
  },
  {
    title: "Uncover Your Critical Citation Gaps",
    body: "Identify precisely where and why your competitors are being cited over you—and get the tactical playbook to close those gaps.",
  },
  {
    title: "Master RAG Crawler Optimization",
    body: "Get the precise technical requirements, semantic structures, and API data feeds that force LLMs to trust and cite your domain.",
  },
  {
    title: "Transition from Traffic to Share of Model",
    body: "Stop tracking vanity keywords. Learn how to measure, prove, and scale your brand's share of generative search answers and directly feed your pipeline.",
  },
] as const;

const SOFTWARE_CATEGORIES = [
  "Enterprise Analytics",
  "DevOps",
  "FinTech",
  "Cybersecurity",
  "MarTech / CDP",
  "HR Tech",
  "Sales Enablement",
  "Other B2B SaaS",
] as const;

const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "icloud.com",
  "me.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "mail.com",
  "yandex.com",
  "gmx.com",
]);

function isWorkEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase().trim();
  return Boolean(domain && !PERSONAL_EMAIL_DOMAINS.has(domain));
}

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
          {tracker.activeSectionLabel ?? "GEO Playbook"}
        </span>
      </div>
    </div>
  );
}

function SectionShell({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/15 font-display text-lg font-bold text-accent">
          {number}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-2xl font-bold leading-tight text-ink sm:text-3xl">
            {title}
          </h2>
          <div className="mt-5 space-y-4 text-base leading-relaxed text-muted">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

function LeadCaptureForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [domain, setDomain] = useState("");
  const [competitor, setCompetitor] = useState("");
  const [category, setCategory] = useState<string>(SOFTWARE_CATEGORIES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanDomain = domain
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");
    const cleanCompetitor = competitor
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");

    if (!cleanEmail || !cleanDomain) {
      setError("Work email and company domain are required.");
      return;
    }
    if (!isWorkEmail(cleanEmail)) {
      setError("Please use your work email — personal domains are not accepted.");
      return;
    }

    setLoading(true);
    try {
      await joinWaitlist(cleanEmail);
      sessionStorage.setItem(
        ONBOARDING_STORAGE_KEY,
        JSON.stringify({
          domain: cleanDomain,
          competitor: cleanCompetitor,
          category,
          buyerQuestion: `best ${category.toLowerCase()} software\nalternatives to ${cleanCompetitor || "leading competitor"}\nhow to choose ${category.toLowerCase()} for enterprise`,
        }),
      );
      const params = new URLSearchParams({ domain: cleanDomain });
      if (cleanCompetitor) params.set("competitor", cleanCompetitor);
      router.push(`/audit?${params.toString()}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-ink">Work email</span>
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="name@yourcompany.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none ring-accent/30 transition focus:ring-2"
          />
          <span className="mt-1 block text-xs text-muted">
            Verifies B2B intent — personal domains blocked
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink">Company domain</span>
          <input
            type="text"
            required
            autoComplete="organization"
            placeholder="yourcompany.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none ring-accent/30 transition focus:ring-2"
          />
          <span className="mt-1 block text-xs text-muted">
            Pulls your real-time AI citation footprint
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink">
            Primary competitor domain
          </span>
          <input
            type="text"
            placeholder="competitor.com"
            value={competitor}
            onChange={(e) => setCompetitor(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none ring-accent/30 transition focus:ring-2"
          />
          <span className="mt-1 block text-xs text-muted">
            Shows immediate comparative citation overlap
          </span>
        </label>

        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-ink">
            Most important software category
          </span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none ring-accent/30 transition focus:ring-2"
          >
            {SOFTWARE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-accent px-6 py-4 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60 sm:w-auto"
      >
        {loading ? "Starting audit…" : "Get playbook + run 60-second audit"}
      </button>
    </form>
  );
}

export function InteractiveArticle() {
  const articleRef = useRef<HTMLElement>(null);
  const tracker = useReadTimeTracker(articleRef, ARTICLE_WORD_COUNT, {
    sections: [...SECTIONS],
  });

  return (
    <div className="relative pb-16 lg:pb-0">
      <MobileReadBar tracker={tracker} />

      <div className="mx-auto flex max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:px-8">
        <ReadTimeRail tracker={tracker} sections={SECTIONS} />

        <article ref={articleRef} className="min-w-0 flex-1 space-y-14">
          <header className="rounded-3xl border border-border bg-gradient-to-br from-ink via-ink to-accent/30 p-6 text-white sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
              Part 1 · Lead magnet blueprint
            </p>
            <h1 className="font-display mt-3 text-3xl font-bold leading-tight sm:text-4xl lg:text-[2.65rem]">
              The Generative Engine Optimization (GEO) Playbook: How to Dominate
              B2B &ldquo;Money Prompts&rdquo; in ChatGPT, Claude, and Perplexity
            </h1>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white/90">
                {tracker.minutes} min read
              </span>
              <span className="rounded-full border border-accent/40 bg-accent/20 px-3 py-1 font-medium text-white">
                4 modules · B2B SaaS
              </span>
            </div>
          </header>

          <section
            id="geo-curriculum"
            className="scroll-mt-28 rounded-2xl border border-border bg-surface p-6 sm:p-8"
          >
            <h2 className="font-display text-lg font-bold text-ink">
              Playbook index &amp; curriculum
            </h2>
            <ol className="mt-5 space-y-4">
              {MODULES.map((mod) => (
                <li key={mod.id}>
                  <a
                    href={`#${mod.id}`}
                    className="group flex gap-4 rounded-xl border border-border bg-white p-4 shadow-sm transition hover:border-accent/40 hover:shadow-md"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 font-display text-sm font-bold text-accent">
                      {mod.number}
                    </span>
                    <div className="min-w-0">
                      <p className="font-display font-bold text-ink group-hover:text-accent">
                        Module {mod.number}: {mod.title}
                      </p>
                      <ul className="mt-2 space-y-1">
                        {mod.topics.map((topic) => (
                          <li
                            key={topic.label}
                            className="text-sm text-muted before:mr-2 before:text-accent before:content-['•']"
                          >
                            <span className="font-medium text-ink">
                              {topic.label}:
                            </span>{" "}
                            {topic.body}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </a>
                </li>
              ))}
            </ol>
          </section>

          {MODULES.map((mod) => (
            <SectionShell
              key={mod.id}
              id={mod.id}
              number={mod.number}
              title={mod.title}
            >
              <div className="space-y-4">
                {mod.topics.map((topic, i) => (
                  <article
                    key={topic.label}
                    className="overflow-hidden rounded-2xl border border-border"
                  >
                    <div className="flex items-center gap-3 border-b border-border bg-ink px-5 py-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/20 text-xs font-bold text-accent">
                        {i + 1}
                      </span>
                      <h3 className="font-display text-sm font-bold text-white sm:text-base">
                        {topic.label}
                      </h3>
                    </div>
                    <p className="bg-surface p-5 text-sm leading-relaxed">
                      {topic.body}
                    </p>
                  </article>
                ))}
              </div>
            </SectionShell>
          ))}

          <section
            id="geo-landing"
            className="scroll-mt-28 overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/10 via-white to-surface"
          >
            <div className="border-b border-accent/20 bg-ink px-6 py-3 sm:px-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
                Part 2 · Landing page copy
              </p>
            </div>
            <div className="space-y-8 p-6 sm:p-10">
              <div>
                <h2 className="font-display text-2xl font-bold leading-tight text-ink sm:text-3xl lg:text-4xl">
                  Stop Optimizing for Clicks That Don&apos;t Exist. Get Cited in
                  the AI Answers Your Buyers Actually Read.
                </h2>
                <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted sm:text-lg">
                  Traditional SEO is bleeding traffic to AI engines. Acquire the
                  definitive technical blueprint to map your B2B SaaS &ldquo;Money
                  Prompts,&rdquo; audit your brand&apos;s current AI visibility, and
                  claim your unfair share of generative recommendations on
                  autopilot.
                </p>
              </div>

              <ul className="grid gap-4 sm:grid-cols-2">
                {VALUE_BULLETS.map((bullet, i) => (
                  <li
                    key={bullet.title}
                    className="flex gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent font-display text-sm font-bold text-white">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-display font-bold text-ink">
                        {bullet.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted">
                        {bullet.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section
            id="geo-capture"
            className="scroll-mt-28 rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-10"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">
              Part 3 · Lead capture
            </p>
            <h2 className="font-display mt-2 text-2xl font-bold text-ink sm:text-3xl">
              Get Your Free Playbook + Run an Instant 60-Second Citation Audit
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Enter your work details below. We&apos;ll deliver the playbook and
              pre-load your domain for a live AI citation footprint check.
            </p>
            <div className="mt-8">
              <LeadCaptureForm />
            </div>
            <p className="mt-6 text-center text-xs text-muted">
              Already have an account?{" "}
              <Link href="/audit" className="font-medium text-accent hover:underline">
                Run audit directly
              </Link>
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
