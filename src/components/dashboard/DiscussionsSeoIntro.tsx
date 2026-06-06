import { Panel } from "@/components/dashboard/DashboardUI";
import Link from "next/link";

/** Server-rendered discussions hub overview for SEO and orientation. */
export function DiscussionsSeoIntro() {
  return (
    <Panel className="mt-10">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
        Buyer discussion radar for GEO research
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted md:text-base">
        CitePilot Discussions surfaces high-intent threads where technical buyers
        ask real questions — on Hacker News, Stack Overflow, and the open web —
        before they ever hit your contact form. Use these conversations to shape
        money prompts, draft citation-ready answers, and spot where competitors
        already own the narrative in AI and community search.
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            Hacker News & Stack Overflow buyer intent
          </h2>
          <p className="mt-2">
            Unlike generic social listening, this radar prioritizes forums where
            practitioners compare tools, ask implementation questions, and request
            alternatives — the same language that appears in ChatGPT and Perplexity
            prompts. Results are keyed to your workspace buyer question from{" "}
            <Link href="/dashboard/settings" className="font-semibold text-accent">
              Settings
            </Link>
            , so every thread maps to a prompt you can audit and track over time.
          </p>
          <p className="mt-2">
            Open threads directly from the dashboard, note which competitors get
            recommended, and turn recurring objections into FAQ schema, comparison
            pages, or answer capsules on your site. Participation itself can earn
            citations when LLMs retrieve those threads during RAG lookups.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            Web search discovery (Serper & Tavily)
          </h2>
          <p className="mt-2">
            When Serper or Tavily API keys are configured, CitePilot augments
            community results with recent web pages that match your buyer question.
            That helps you find listicles, review roundups, and Q&A posts that
            already rank — prime targets for outreach, backlinks, or content that
            displaces outdated recommendations in generative answers.
          </p>
          <p className="mt-2">
            If no threads appear, refine your buyer question to mirror how
            prospects phrase problems (&ldquo;best CRM for agencies under 50
            seats&rdquo; beats &ldquo;CRM software&rdquo;). Re-run after updating
            prompts and competitors so discussion alerts in Settings stay aligned.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            From threads to citation lift
          </h2>
          <p className="mt-2">
            Discussions are research input for your GEO loop: audit gaps on{" "}
            <Link href="/dashboard/geo-audit" className="font-semibold text-accent">
              GEO Audit
            </Link>
            , publish targeted articles on{" "}
            <Link href="/dashboard/content" className="font-semibold text-accent">
              Content
            </Link>
            , earn authority links on{" "}
            <Link href="/dashboard/backlinks" className="font-semibold text-accent">
              Backlinks
            </Link>
            , then rescan to prove citation movement on{" "}
            <Link href="/dashboard/analytics" className="font-semibold text-accent">
              Analytics
            </Link>
            . Enable discussion opportunity alerts in Settings to get emailed when
            fresh threads match your niche.
          </p>
          <h3 className="mt-4 font-semibold text-ink">Research workflow</h3>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Start from one sharp buyer question per workspace.</li>
            <li>Log competitor mentions and recurring feature comparisons.</li>
            <li>Draft an on-site answer page before engaging in the thread.</li>
            <li>Re-audit money prompts within a week of publishing fixes.</li>
          </ul>
        </section>
      </div>
    </Panel>
  );
}
