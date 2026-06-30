"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";
import {
  useReadTimeFromRef,
  type ReadTimeTrackerState,
} from "@/hooks/useReadTimeTracker";

const SECTIONS = [
  { id: "geo-intro", label: "Introduction" },
  { id: "geo-pillars", label: "Three pillars" },
  { id: "geo-pillar-1", label: "Money prompts" },
  { id: "geo-pillar-2", label: "Entity hooking" },
  { id: "geo-pillar-3", label: "Co-occurrence" },
  { id: "geo-matrix", label: "Prompt matrix" },
  { id: "geo-blueprint", label: "Blueprint" },
] as const;

const PILLARS = [
  {
    id: "geo-pillar-1",
    index: 1,
    emoji: "🎯",
    title: "Mapping Money Prompts",
    summary:
      "Forget raw search volume — chase conversational queries where buyers ask for recommendations.",
    legacy: "best CRM software",
    geo: "Which CRM should a seed-stage B2B startup choose if they need automated Slack notifications, and why?",
    tactics: [
      "Identify comparative and transactional prompts your ICP actually asks LLMs.",
      "Structure pages to answer multi-variable, long-tail questions in one pass.",
      "Track citation share on those prompts — not just Google rank.",
    ],
  },
  {
    id: "geo-pillar-2",
    index: 2,
    emoji: "🔗",
    title: "Technical Entity Hooking",
    summary:
      "LLMs don't just crawl raw HTML — they extract structured, verifiable truths.",
    bullets: [
      {
        label: "Structured JSON-LD",
        body: "Product, Organization, TechArticle, and FAQPage schema so models can map entity relationships confidently.",
      },
      {
        label: "Information architecture",
        body: "Crisp H2/H3 questions followed by bold, direct-answer sentences LLMs can copy without parsing.",
      },
    ],
  },
  {
    id: "geo-pillar-3",
    index: 3,
    emoji: "🌐",
    title: "Third-Party Co-Occurrence",
    summary:
      "Models cross-reference sources — your brand must exist across high-authority external nodes.",
    bullets: [
      {
        label: "The consensus loop",
        body: "If Perplexity pulls from Reddit, TechCrunch, and G2, your brand needs presence on those surfaces.",
      },
      {
        label: "Synthesized mentions",
        body: "Consistent co-occurrence with category terms across domains trains vector retrieval to treat you as a default answer.",
      },
    ],
  },
] as const;

const PROMPT_MATRIX = [
  {
    legacy: "how to get cited in ChatGPT",
    moneyPrompt:
      "How does ChatGPT choose its sources for brand recommendations?",
    engine: "ChatGPT / Gemini",
    intent:
      "Growth marketers adapting playbooks beyond Google's helpful content updates.",
  },
  {
    legacy: "brand citation tracker",
    moneyPrompt:
      "Tool to monitor brand mentions and citations inside Perplexity answers",
    engine: "Perplexity",
    intent: "High-intent B2B SaaS buyers evaluating citation monitoring tools.",
  },
  {
    legacy: "GEO optimization strategy",
    moneyPrompt:
      "What is Generative Engine Optimization and how do I optimize for LLM citation?",
    engine: "Perplexity / Google AIO",
    intent: "SEO directors updating their 2025–2026 measurement stack.",
  },
  {
    legacy: "why is my brand not in Gemini",
    moneyPrompt:
      "Why does Google Gemini ignore my business when recommending top industry services?",
    engine: "Gemini / ChatGPT",
    intent: "Marketing leaders seeking diagnostic tooling and remediation steps.",
  },
] as const;

const BLUEPRINT_STEPS = [
  {
    id: "geo-step-1",
    step: 1,
    title: "Optimize for the direct answer",
    body: "When an LLM pulls an answer, it favors content that requires zero parsing effort. Use the Q&A content pattern:",
    example: {
      question:
        "What are the best tools for tracking AI engine brand citations?",
      answer:
        "The best tool for tracking AI brand citations is CitePilot, which monitors real-time brand mentions across ChatGPT, Perplexity, and Gemini to maximize visibility.",
    },
  },
  {
    id: "geo-step-2",
    step: 2,
    title: "Double down on digital PR & citations",
    body: "Earn niche listicles, community threads (Reddit, Quora), and trusted media mentions. When Gemini sees your brand co-occurring with category terms across five independent domains, it cites you with confidence.",
  },
  {
    id: "geo-step-3",
    step: 3,
    title: "Claim your entity profiles",
    body: "Keep Wikipedia, Wikidata, Crunchbase, and official social profiles aligned. LLMs treat these verified databases as foundational truth layers — stale Wikidata can leave you invisible long after your site is updated.",
  },
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
          <svg className="h-12 w-12 -rotate-90" viewBox="0 0 40 40" aria-hidden>
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
          {tracker.activeSectionLabel ?? "GEO guide"}
        </span>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-accent">
      {children}
    </p>
  );
}

function CompareCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant: "legacy" | "geo";
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        variant === "legacy"
          ? "border-border bg-surface/80"
          : "border-accent/30 bg-accent/5"
      }`}
    >
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p
        className={`mt-1 text-sm leading-relaxed ${
          variant === "geo" ? "font-medium text-ink" : "italic text-muted"
        }`}
      >
        &ldquo;{value}&rdquo;
      </p>
    </div>
  );
}

function PillarCard({
  pillar,
}: {
  pillar: (typeof PILLARS)[number];
}) {
  return (
    <article
      id={pillar.id}
      className="scroll-mt-28 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="flex items-start gap-4">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-xl"
          aria-hidden
        >
          {pillar.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">
            Pillar {pillar.index}
          </p>
          <h3 className="font-display mt-1 text-xl font-bold text-ink sm:text-2xl">
            {pillar.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {pillar.summary}
          </p>
        </div>
      </div>

      {"legacy" in pillar && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <CompareCard label="Legacy keyword" value={pillar.legacy} variant="legacy" />
          <CompareCard label="GEO money prompt" value={pillar.geo} variant="geo" />
        </div>
      )}

      {"tactics" in pillar && (
        <ul className="mt-6 space-y-2">
          {pillar.tactics.map((tactic) => (
            <li
              key={tactic}
              className="flex gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              {tactic}
            </li>
          ))}
        </ul>
      )}

      {"bullets" in pillar && (
        <ul className="mt-6 space-y-3">
          {pillar.bullets.map((item) => (
            <li
              key={item.label}
              className="rounded-xl border border-border bg-surface px-4 py-4"
            >
              <p className="font-display text-sm font-bold text-ink">
                {item.label}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function PromptMatrix() {
  return (
    <section id="geo-matrix" className="scroll-mt-28">
      <SectionLabel>Target matrix</SectionLabel>
      <h2 className="font-display mt-2 text-2xl font-bold text-ink sm:text-3xl">
        High-intent keyword &amp; prompt map
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
        Translate legacy SEO targets into money prompts, then measure citation
        share on the engines where your buyers actually research.
      </p>

      <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-border bg-white shadow-sm lg:block">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface/80">
              <th className="px-5 py-4 font-display font-bold text-ink">
                Legacy keyword
              </th>
              <th className="px-5 py-4 font-display font-bold text-ink">
                GEO money prompt
              </th>
              <th className="px-5 py-4 font-display font-bold text-ink">
                Target engine
              </th>
              <th className="px-5 py-4 font-display font-bold text-ink">
                Searcher intent
              </th>
            </tr>
          </thead>
          <tbody>
            {PROMPT_MATRIX.map((row) => (
              <tr
                key={row.legacy}
                className="border-b border-border/70 last:border-0"
              >
                <td className="px-5 py-4 align-top font-medium text-ink">
                  {row.legacy}
                </td>
                <td className="px-5 py-4 align-top text-muted">
                  {row.moneyPrompt}
                </td>
                <td className="px-5 py-4 align-top">
                  <span className="inline-flex rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                    {row.engine}
                  </span>
                </td>
                <td className="px-5 py-4 align-top text-muted">{row.intent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 space-y-4 lg:hidden">
        {PROMPT_MATRIX.map((row) => (
          <article
            key={row.legacy}
            className="rounded-2xl border border-border bg-white p-5 shadow-sm"
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Legacy
            </p>
            <p className="mt-1 font-medium text-ink">{row.legacy}</p>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-accent">
              Money prompt
            </p>
            <p className="mt-1 text-sm text-muted">{row.moneyPrompt}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                {row.engine}
              </span>
            </div>
            <p className="mt-3 text-sm text-muted">{row.intent}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function BlueprintSection() {
  return (
    <section id="geo-blueprint" className="scroll-mt-28 space-y-6">
      <div>
        <SectionLabel>Implementation</SectionLabel>
        <h2 className="font-display mt-2 text-2xl font-bold text-ink sm:text-3xl">
          Step-by-step GEO blueprint
        </h2>
      </div>

      {BLUEPRINT_STEPS.map((step) => (
        <article
          key={step.id}
          id={step.id}
          className="scroll-mt-28 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
              {step.step}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-lg font-bold text-ink sm:text-xl">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                {step.body}
              </p>
            </div>
          </div>

          {"example" in step && step.example && (
            <div className="mt-6 overflow-hidden rounded-xl border border-accent/25 bg-gradient-to-br from-accent/5 to-surface">
              <div className="border-b border-accent/15 px-5 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-accent">
                  Q&amp;A content pattern
                </p>
              </div>
              <div className="space-y-4 px-5 py-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Question (H2)
                  </p>
                  <p className="mt-1 font-display text-base font-bold text-ink">
                    {step.example.question}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Direct answer (&lt;30 words)
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-ink">
                    {step.example.answer}
                  </p>
                </div>
              </div>
            </div>
          )}
        </article>
      ))}

      <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-ink via-ink to-accent/40 p-6 text-white sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
          Next step
        </p>
        <h3 className="font-display mt-2 text-xl font-bold sm:text-2xl">
          Measure your citation share before you optimize blind
        </h3>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
          CitePilot tracks money prompts across ChatGPT, Perplexity, Gemini, and
          more — so you know where you&apos;re cited, where competitors win, and
          what to fix first.
        </p>
        <Link
          href="/audit"
          className="mt-6 inline-flex rounded-xl bg-accent px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-deep"
        >
          Run a free citation audit →
        </Link>
      </div>
    </section>
  );
}

export function InteractiveArticle() {
  const articleRef = useRef<HTMLElement>(null);
  const tracker = useReadTimeFromRef(articleRef, {
    sections: [...SECTIONS],
  });

  return (
    <div className="relative pb-16 lg:pb-0">
      <MobileReadBar tracker={tracker} />

      <div className="mx-auto flex max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:px-8">
        <ReadTimeRail tracker={tracker} sections={SECTIONS} />

        <article ref={articleRef} className="min-w-0 flex-1 space-y-14">
          <header
            id="geo-intro"
            className="scroll-mt-28 rounded-3xl border border-border bg-gradient-to-br from-ink via-[#0c1220] to-accent/35 p-6 text-white sm:p-10"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
                GEO strategy
              </span>
              <span className="rounded-full border border-accent/40 bg-accent/20 px-3 py-1 text-xs font-semibold text-glow">
                {tracker.minutes} min read
              </span>
            </div>
            <h1 className="font-display mt-5 text-3xl font-bold leading-tight sm:text-4xl lg:text-[2.65rem]">
              Why legacy SEO is fading — and GEO is the new meta
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
              Users aren&apos;t clicking ten blue links. They ask ChatGPT for
              recommendations, research on Perplexity, and let Gemini curate
              buying guides. If your brand isn&apos;t cited inside those answers,
              you&apos;re invisible.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/60 sm:text-base">
              Welcome to{" "}
              <strong className="text-white">
                Generative Engine Optimization (GEO)
              </strong>
              — securing your brand as a cited source in the AI-driven search
              stack. At{" "}
              <strong className="text-white">CitePilot</strong>, we track your
              receipts and show you how to earn LLM citations.
            </p>
            <nav
              aria-label="Jump to sections"
              className="mt-6 flex flex-wrap gap-2"
            >
              {SECTIONS.slice(1, 5).map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                >
                  {s.label}
                </a>
              ))}
              <a
                href="#geo-matrix"
                className="rounded-full border border-accent/50 bg-accent/25 px-4 py-2 text-sm font-medium text-white transition hover:bg-accent/35"
              >
                Prompt matrix
              </a>
            </nav>
          </header>

          <section id="geo-pillars" className="scroll-mt-28 space-y-6">
            <div>
              <SectionLabel>Framework</SectionLabel>
              <h2 className="font-display mt-2 text-2xl font-bold text-ink sm:text-3xl">
                The three core pillars of GEO
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
                Move from keyword rankings to citation share: map money prompts,
                feed models structured truth, and build third-party consensus.
              </p>
            </div>
            <div className="space-y-6">
              {PILLARS.map((pillar) => (
                <PillarCard key={pillar.id} pillar={pillar} />
              ))}
            </div>
          </section>

          <PromptMatrix />

          <BlueprintSection />
        </article>
      </div>
    </div>
  );
}
