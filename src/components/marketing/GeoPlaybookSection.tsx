"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { joinWaitlist } from "@/lib/client/api";
import {
  downloadGeoPlaybook,
  geoPlaybook,
  geoPlaybookCurriculum,
} from "@/lib/marketing/geo-playbook";
import { ONBOARDING_STORAGE_KEY } from "@/lib/onboarding";

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
      downloadGeoPlaybook();
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
            Required to pull the real-time AI citation footprint
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
        {loading
          ? "Starting audit…"
          : "Get playbook + run 60-second citation audit"}
      </button>
    </form>
  );
}

export function GeoPlaybookSection() {
  return (
    <div className="space-y-14">
      <section
        id="geo-playbook"
        className="scroll-mt-28 overflow-hidden rounded-3xl border-2 border-accent/40 bg-white shadow-md"
      >
        <div className="bg-gradient-to-br from-ink via-ink to-accent/40 px-6 py-8 text-white sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
            Part 1 · Lead magnet blueprint
          </p>
          <h2 className="font-display mt-2 text-2xl font-bold leading-tight sm:text-3xl">
            {geoPlaybook.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75">
            {geoPlaybook.description}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={downloadGeoPlaybook}
              className="inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/90"
            >
              Download playbook (.md)
            </button>
            <Link
              href="/audit"
              className="inline-flex rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Run free citation audit
            </Link>
          </div>
        </div>
      </section>

      <section
        id="geo-curriculum"
        className="scroll-mt-28 rounded-2xl border border-border bg-surface p-6 sm:p-8"
      >
        <h2 className="font-display text-lg font-bold text-ink">
          Playbook index &amp; curriculum
        </h2>
        <ol className="mt-5 space-y-4">
          {geoPlaybookCurriculum.map((mod) => (
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

      {geoPlaybookCurriculum.map((mod) => (
        <section key={mod.id} id={mod.id} className="scroll-mt-28">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/15 font-display text-lg font-bold text-accent">
              {mod.number}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-2xl font-bold leading-tight text-ink sm:text-3xl">
                {mod.title}
              </h3>
              <div className="mt-5 space-y-4">
                {mod.topics.map((topic, i) => (
                  <article
                    key={topic.label}
                    className="overflow-hidden rounded-2xl border border-border"
                  >
                    <div className="flex items-center gap-3 border-b border-border bg-ink px-5 py-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/20 text-xs font-bold text-accent">
                        {i + 1}
                      </span>
                      <h4 className="font-display text-sm font-bold text-white sm:text-base">
                        {topic.label}
                      </h4>
                    </div>
                    <p className="bg-surface p-5 text-sm leading-relaxed text-muted">
                      {topic.body}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      ))}

      <section
        id="geo-landing"
        className="scroll-mt-28 overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/10 via-white to-surface"
      >
        <div className="border-b border-accent/20 bg-ink px-6 py-3 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
            Part 2 · High-converting landing page copy
          </p>
        </div>
        <div className="space-y-8 p-6 sm:p-10">
          <div>
            <h2 className="font-display text-2xl font-bold leading-tight text-ink sm:text-3xl lg:text-4xl">
              Stop Optimizing for Clicks That Don&apos;t Exist. Track Whether
              You&apos;re Cited in the AI Answers Your Buyers Actually Read.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted sm:text-lg">
              Traditional SEO is bleeding traffic to AI engines. Acquire the
              definitive technical blueprint to map your B2B SaaS &ldquo;Money
              Prompts,&rdquo; audit your brand&apos;s current AI visibility, and
              close citation gaps with weekly monitoring and prioritized fixes.
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
          Part 3 · Frictionless lead capture
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
      </section>
    </div>
  );
}
