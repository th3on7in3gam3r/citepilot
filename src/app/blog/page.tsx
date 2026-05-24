import Link from "next/link";
import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Container";
import { getAllPosts } from "@/lib/blog";
import {
  AUDIENCE_LABELS,
  CONTENT_TYPE_LABELS,
  EDITORIAL_PILLARS,
} from "@/lib/content-strategy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "SEO, GEO, and AI citation playbooks for founders, agencies, and SaaS teams — from CitePilot.",
};

export default async function BlogIndexPage() {
  const posts = await getAllPosts();

  return (
    <>
      <Header />
      <main className="bg-cream pt-24 pb-16">
        <Container>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            CitePilot editorial
          </p>
          <h1 className="font-display mt-2 max-w-2xl text-4xl font-bold text-ink md:text-5xl">
            SEO &amp; AI visibility, explained like a mentor — not a content farm
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Practical guides on Google rankings, LLM citations, technical SEO, and
            agency growth. Built for extractability in ChatGPT and clarity in search.
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EDITORIAL_PILLARS.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-border bg-white px-4 py-3 text-sm"
              >
                <p className="font-semibold text-ink">{p.title}</p>
                <p className="mt-1 text-xs text-muted">{p.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 space-y-6">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="rounded-2xl border border-border bg-white p-6 shadow-sm transition hover:border-accent/40"
              >
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-accent/10 px-3 py-1 text-accent">
                    {EDITORIAL_PILLARS.find((p) => p.id === post.pillar)?.title ??
                      post.pillar}
                  </span>
                  <span className="rounded-full bg-surface px-3 py-1 text-muted">
                    {AUDIENCE_LABELS[post.audience]}
                  </span>
                  <span className="rounded-full bg-surface px-3 py-1 text-muted">
                    {CONTENT_TYPE_LABELS[post.contentType]}
                  </span>
                </div>
                <h2 className="font-display mt-4 text-2xl font-bold text-ink">
                  <Link href={`/blog/${post.slug}`} className="hover:text-accent">
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-2 text-muted">{post.description}</p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-4 inline-block text-sm font-semibold text-accent"
                >
                  Read article →
                </Link>
              </article>
            ))}
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
