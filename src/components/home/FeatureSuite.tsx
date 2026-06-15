"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { authClient } from "@/lib/auth/client";
import { productFeatures } from "@/lib/features";

export function FeatureSuite() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authClient
      .getSession()
      .then(({ data }) => {
        if (!cancelled) setSignedIn(Boolean(data?.session));
      })
      .catch(() => {
        if (!cancelled) setSignedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Section id="features" className="bg-cream dark:bg-background">
      <SectionHeading
        eyebrow="Product"
        title="A powerful suite of features — all in one place."
        description="Citation-first GEO: content, authority, technical audits, and LLM tracking in a single workspace."
        align="center"
      />
      <div className="mt-14 grid gap-6 md:mt-16 md:grid-cols-2 lg:grid-cols-3">
        {productFeatures.map((f) => {
          const href = signedIn
            ? (f.dashboardHref ?? "/dashboard")
            : "/audit";
          const cta = signedIn ? "Open in dashboard →" : "Start free audit →";

          return (
            <article
              key={f.id}
              className="rounded-2xl border border-border bg-card p-8 shadow-sm transition hover:border-accent/40 hover:shadow-md dark:border-[#222] dark:bg-card dark:shadow-black/20 dark:hover:border-accent/40"
            >
              <h3 className="font-display text-lg font-bold text-ink">
                {f.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {f.description}
              </p>
              {href && (
                <Link
                  href={href}
                  className="mt-5 inline-block text-sm font-semibold text-accent hover:text-accent-deep"
                >
                  {cta}
                </Link>
              )}
            </article>
          );
        })}
      </div>
      <div className="mt-12 text-center">
        <Link
          href="/#get-started"
          className="inline-flex rounded-full border-2 border-accent/30 bg-white px-8 py-3.5 text-sm font-semibold text-accent transition hover:border-accent hover:bg-accent/5 dark:border-accent/40 dark:bg-card dark:hover:bg-accent/10"
        >
          Get started →
        </Link>
      </div>
    </Section>
  );
}
