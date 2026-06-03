"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";
import {
  useReadTimeTracker,
  type ReadTimeTrackerState,
} from "@/hooks/useReadTimeTracker";

const ARTICLE_WORD_COUNT = 920;

const SECTIONS = [
  { id: "geo-section-1", label: "1. GEO era" },
  { id: "geo-section-2", label: "2. RAG loop" },
  { id: "geo-section-3", label: "3. Money prompts" },
  { id: "geo-section-4", label: "4. Strategies" },
  { id: "geo-section-5", label: "5. Roadmap" },
] as const;

const TOC = [
  {
    id: "geo-section-1",
    title: "The Death of the 10 Blue Links: Welcome to the GEO Era",
  },
  {
    id: "geo-section-2",
    title: "Understanding the Retrieval-Augmented Generation (RAG) Loop",
  },
  {
    id: "geo-section-3",
    title: "What are 'Money Prompts' and Why Do They Matter?",
  },
  {
    id: "geo-section-4",
    title: "Three Technical Strategies to Force LLM Citations",
  },
  {
    id: "geo-section-5",
    title: "Actionable Roadmap: Audit Your Brand's AI Footprint Today",
  },
] as const;

const RAG_PHASES = [
  {
    step: 1,
    title: "Query Deconstruction",
    body: "The engine interprets the semantic intent and entities of the user prompt.",
  },
  {
    step: 2,
    title: "External Retrieval",
    body: "The LLM queries its vector databases and real-time search APIs to pull the top 10 to 20 most contextually relevant web pages.",
  },
  {
    step: 3,
    title: "Context Synthesis & Citation",
    body: "The LLM's neural network synthesizes those sources into a single coherent response, placing inline citations on the specific claims it retrieved from external sites.",
  },
] as const;

const MONEY_PROMPTS = [
  "What is the best enterprise CRM for mid-market manufacturing companies?",
  "Compare Slack vs Microsoft Teams for technical developers.",
  "Which cloud security compliance software integrates natively with AWS?",
] as const;

const STRATEGIES = [
  {
    number: 1,
    title: "Structural and Semantic Entity Alignment",
    body: "LLMs understand the world through entities and relationships. Ensure your website utilizes robust Schema.org structured data markup (such as Product, Organization, and Review schemas) to establish undisputed facts about your brand. Use clear, declarative subject-verb-object sentences in your core pages so LLMs can easily parse your capabilities and ingest them into their vector databases.",
  },
  {
    number: 2,
    title: "Build the 'Consensus Engine' Footprint",
    body: "When answering a prompt, LLMs cross-reference multiple sources to ensure accuracy. If your product is listed as the top solution on your own website, but missing on major review aggregators, industry directories, and top-tier publications, the LLM will treat your brand with low confidence. You must secure a presence across the entire third-party ecosystem so that the LLM finds a consensus of your authority.",
  },
  {
    number: 3,
    title: "Uncompromising Content Density",
    body: "LLMs favor high-density information. Avoid fluffy, long-form content that says very little. Instead, structure your content with deep technical answers, clear bullet points, definition blocks, and authoritative data. When your page provides the most direct, verifiable answer to a complex query, the LLM's retrieval model prioritizes your content over shallow landing pages.",
  },
] as const;

const ROADMAP_STEPS = [
  "Identify your top 20 Money Prompts: Map out the exact conversational phrases your ideal customers use when looking for a product like yours.",
  "Test them across major engines: Manually or programmatically check how your brand is represented in ChatGPT, Perplexity, and Google AI Overviews.",
  "Analyze the cited sources: See who is currently getting the traffic and citation attribution.",
  "Deploy automated tracking: Use Cite Pilot to monitor these prompts on autopilot and instantly deploy programmatic landing pages designed to capture those specific citation opportunities.",
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
              GEO Playbook
            </p>
            <h1 className="font-display mt-3 text-3xl font-bold leading-tight sm:text-4xl lg:text-[2.75rem]">
              The Generative Engine Optimization (GEO) Playbook
            </h1>
            <p className="mt-3 text-lg text-white/80 sm:text-xl">
              How to Secure Citations in ChatGPT, Perplexity, and Google AI
              Overviews
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white/90">
                {tracker.minutes} min read
              </span>
              <span className="rounded-full border border-accent/40 bg-accent/20 px-3 py-1 font-medium text-white">
                B2B SaaS · Citation intelligence
              </span>
            </div>
          </header>

          <nav
            aria-label="Table of contents"
            className="rounded-2xl border border-border bg-surface p-6 sm:p-8"
          >
            <h2 className="font-display text-lg font-bold text-ink">
              Table of contents
            </h2>
            <ol className="mt-4 space-y-2">
              {TOC.map((item, i) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="group flex gap-3 rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-white hover:text-ink"
                  >
                    <span className="font-semibold text-accent">{i + 1}.</span>
                    <span className="group-hover:text-ink">{item.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <SectionShell
            id="geo-section-1"
            number={1}
            title="The Death of the 10 Blue Links: Welcome to the GEO Era"
          >
            <p>
              Traditional search engine optimization is facing its most disruptive
              paradigm shift since the dawn of the commercial web. The standard user
              behavior—entering a keyword query, scanning ten blue links, and
              manually clicking through pages—is rapidly being replaced by
              conversational, synthesized answers.
            </p>
            <p>
              Today, decision-makers are asking platforms like ChatGPT, Perplexity,
              and Google Gemini complex, multi-variable questions. Instead of
              presenting a directory of links, these systems retrieve real-time
              context, synthesize a comprehensive answer, and cite their sources
              directly within the response text.
            </p>
            <div className="rounded-xl border border-accent/30 bg-accent/5 px-5 py-4 text-ink">
              <p className="text-sm leading-relaxed">
                If your B2B SaaS platform is not cited as an active source inside
                these AI-generated answers, you do not exist in the modern
                buyer&apos;s journey. Securing these citations requires a transition
                from traditional SEO to{" "}
                <strong>Generative Engine Optimization (GEO)</strong>.
              </p>
            </div>
          </SectionShell>

          <SectionShell
            id="geo-section-2"
            number={2}
            title="Understanding the Retrieval-Augmented Generation (RAG) Loop"
          >
            <p>
              To optimize for LLM traffic, growth marketers must understand the
              mechanics of{" "}
              <strong className="text-ink">
                Retrieval-Augmented Generation (RAG)
              </strong>
              . Unlike traditional index-and-rank architectures, generative search
              engines operate in three distinct phases:
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {RAG_PHASES.map((phase) => (
                <div
                  key={phase.step}
                  className="rounded-xl border border-border bg-white p-4 shadow-sm"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-accent">
                    Phase {phase.step}
                  </span>
                  <h3 className="font-display mt-2 font-bold text-ink">
                    {phase.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed">{phase.body}</p>
                </div>
              ))}
            </div>
            <p>
              GEO focuses on ensuring your website is retrieved in step 2, and that
              your brand information is so structured, authoritative, and semantically
              aligned that the LLM is forced to cite you in step 3.
            </p>
          </SectionShell>

          <SectionShell
            id="geo-section-3"
            number={3}
            title="What are 'Money Prompts' and Why Do They Matter?"
          >
            <p>
              For B2B SaaS companies, the most valuable real estate exists within
              high-intent conversational queries—what we define as{" "}
              <strong className="text-ink">Money Prompts</strong>.
            </p>
            <p>These are prompts like:</p>
            <ul className="space-y-3">
              {MONEY_PROMPTS.map((prompt) => (
                <li
                  key={prompt}
                  className="rounded-xl border-l-4 border-accent bg-white px-4 py-3 text-sm italic text-ink shadow-sm"
                >
                  &ldquo;{prompt}&rdquo;
                </li>
              ))}
            </ul>
            <p>
              When a prospective buyer enters a Money Prompt, they are at the bottom
              of the funnel. If an LLM recommends your competitor and cites their
              website, you lose the deal before the user even reaches a standard
              search engine.{" "}
              <strong className="text-ink">Cite Pilot</strong> enables growth teams to
              track these Money Prompts systematically, giving you a real-time view
              of your share of voice within LLM answers.
            </p>
          </SectionShell>

          <SectionShell
            id="geo-section-4"
            number={4}
            title="Three Technical Strategies to Force LLM Citations"
          >
            <p>
              Optimizing for LLM discovery requires a blend of high-density semantic
              writing and clean, crawlable technical structures:
            </p>
            <div className="space-y-4">
              {STRATEGIES.map((strategy) => (
                <article
                  key={strategy.number}
                  className="overflow-hidden rounded-2xl border border-border"
                >
                  <div className="border-b border-border bg-ink px-5 py-3">
                    <h3 className="font-display text-sm font-bold text-white sm:text-base">
                      Strategy {strategy.number}: {strategy.title}
                    </h3>
                  </div>
                  <p className="bg-surface p-5 text-sm leading-relaxed">
                    {strategy.body}
                  </p>
                </article>
              ))}
            </div>
          </SectionShell>

          <SectionShell
            id="geo-section-5"
            number={5}
            title="Actionable Roadmap: Audit Your Brand's AI Footprint Today"
          >
            <p>
              You cannot optimize what you do not measure. To take control of your
              generative search traffic, follow these steps:
            </p>
            <ol className="space-y-3">
              {ROADMAP_STEPS.map((step, i) => (
                <li
                  key={step}
                  className="flex gap-4 rounded-xl border border-border bg-white p-4 shadow-sm"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
            <div className="mt-6 rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/10 via-white to-surface p-6 sm:p-8">
              <h3 className="font-display text-xl font-bold text-ink">
                Run your free citation audit
              </h3>
              <p className="mt-2 text-sm text-muted">
                Map your Money Prompts and see who owns citations in ChatGPT,
                Perplexity, and Google AI Overviews—then track changes on autopilot.
              </p>
              <Link
                href="/audit"
                className="mt-5 inline-flex rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:opacity-95"
              >
                Start free audit
              </Link>
            </div>
          </SectionShell>
        </article>
      </div>
    </div>
  );
}
