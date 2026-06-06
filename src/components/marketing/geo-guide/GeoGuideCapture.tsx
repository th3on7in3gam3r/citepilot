"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { joinWaitlist } from "@/lib/client/api";
import { downloadGeoPlaybook } from "@/lib/marketing/geo-playbook";
import { ONBOARDING_STORAGE_KEY } from "@/lib/onboarding";

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

export function GeoGuideCapture() {
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
    <section
      id="geo-capture"
      className="scroll-mt-28 overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/5 via-white to-surface shadow-sm"
    >
      <div className="grid gap-0 lg:grid-cols-2">
        <div className="border-b border-border p-6 sm:p-10 lg:border-b-0 lg:border-r">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            Put the guide into practice
          </p>
          <h2 className="font-display mt-2 text-2xl font-bold text-ink sm:text-3xl">
            Download playbook + run your citation audit
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Get the full markdown export and a live AI citation footprint for your
            domain — mapped to your money prompts and top competitor.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-muted">
            <li className="flex gap-2">
              <span className="text-accent">✓</span>
              Baseline Share of Model across major engines
            </li>
            <li className="flex gap-2">
              <span className="text-accent">✓</span>
              Competitor displacement map
            </li>
            <li className="flex gap-2">
              <span className="text-accent">✓</span>
              Prioritized remediation checklist
            </li>
          </ul>
          <Link
            href="/audit"
            className="mt-6 inline-flex text-sm font-semibold text-accent hover:underline"
          >
            Or skip to free audit →
          </Link>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5 p-6 sm:p-10">
          <label className="block">
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
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink">Company domain</span>
            <input
              type="text"
              required
              placeholder="yourcompany.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none ring-accent/30 transition focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink">Primary competitor</span>
            <input
              type="text"
              placeholder="competitor.com"
              value={competitor}
              onChange={(e) => setCompetitor(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none ring-accent/30 transition focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink">Software category</span>
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
          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-accent px-6 py-4 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "Starting audit…" : "Get playbook + run citation audit"}
          </button>
        </form>
      </div>
    </section>
  );
}
