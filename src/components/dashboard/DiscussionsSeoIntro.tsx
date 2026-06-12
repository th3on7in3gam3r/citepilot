import { Panel } from "@/components/dashboard/DashboardUI";
import Link from "next/link";

type DiscussionsSeoIntroProps = {
  /** `header` renders above the workspace UI; `footer` renders deep sections below it. */
  section?: "header" | "footer";
};

/** Server-rendered discussions hub overview for SEO and orientation. */
export function DiscussionsSeoIntro({
  section = "header",
}: DiscussionsSeoIntroProps) {
  if (section === "footer") {
    return (
      <Panel className="mt-10">
        <div className="space-y-8 text-sm leading-relaxed text-muted">
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
              . Enable discussion opportunity alerts in{" "}
              <Link href="/dashboard/settings" className="font-semibold text-accent">
                Settings
              </Link>{" "}
              to get emailed when fresh threads match your niche.
            </p>
            <p className="mt-2">
              Community participation can earn citations when LLMs retrieve those
              threads during RAG lookups — but on-site answer pages and schema
              remain the foundation. Use discussions to discover language, not
              replace structured GEO fixes on your domain.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-ink">
              Related workspace tools
            </h2>
            <p className="mt-2">
              Map buyer intent with the{" "}
              <Link href="/chatgpt-prompts" className="font-semibold text-accent">
                ChatGPT money prompts guide
              </Link>
              , baseline citation gaps with the{" "}
              <Link href="/audit" className="font-semibold text-accent">
                free citation audit
              </Link>
              , and deepen GEO strategy in the{" "}
              <Link href="/geo-playbook" className="font-semibold text-accent">
                GEO Playbook
              </Link>
              . For Reddit-specific workflows, open the{" "}
              <Link href="/dashboard/reddit" className="font-semibold text-accent">
                Reddit
              </Link>{" "}
              hub when your buyers congregate there.
            </p>
            <h3 className="mt-4 font-semibold text-ink">Research workflow</h3>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Start from one sharp buyer question per workspace.</li>
              <li>Log competitor mentions and recurring feature comparisons.</li>
              <li>Draft an on-site answer page before engaging in the thread.</li>
              <li>Re-audit money prompts within a week of publishing fixes.</li>
            </ul>
          </section>

          <section aria-labelledby="discussions-faq">
            <h2
              id="discussions-faq"
              className="font-display text-lg font-bold text-ink"
            >
              Discussion radar FAQ
            </h2>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="font-semibold text-ink">
                  Which sources does CitePilot search?
                </dt>
                <dd className="mt-1">
                  Hacker News and Stack Overflow by default, plus web discovery
                  through Serper or Tavily when API keys are configured. Results
                  are keyed to your workspace buyer question from Settings.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">
                  Why am I not seeing threads?
                </dt>
                <dd className="mt-1">
                  Refine your buyer question to mirror how prospects phrase
                  problems — specific comparisons and constraints beat generic
                  category terms. Update prompts and competitors, then refresh
                  this page.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">
                  How do discussions connect to money prompts?
                </dt>
                <dd className="mt-1">
                  Thread language often matches ChatGPT and Perplexity queries.
                  Log recurring objections and competitor recommendations, then
                  add them to monitored prompts and audit citation presence on
                  those exact questions.
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </Panel>
    );
  }

  return (
    <Panel className="mb-10">
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
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted md:text-base">
        Results load in the workspace below based on your buyer question from{" "}
        <Link href="/dashboard/settings" className="font-semibold text-accent">
          Settings
        </Link>
        . Sharpen that question first, then review threads, log competitor
        mentions, and feed insights into your GEO audit and content calendar.
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            Hacker News and Stack Overflow buyer intent
          </h2>
          <p className="mt-2">
            Unlike generic social listening, this radar prioritizes forums where
            practitioners compare tools, ask implementation questions, and request
            alternatives — the same language that appears in ChatGPT and Perplexity
            prompts. Every thread maps to a prompt you can audit and track over
            time on your{" "}
            <Link href="/dashboard" className="font-semibold text-accent">
              dashboard overview
            </Link>
            .
          </p>
          <p className="mt-2">
            Open threads directly from the dashboard, note which competitors get
            recommended, and turn recurring objections into FAQ schema, comparison
            pages, or answer capsules on your site.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            Web search discovery (Serper and Tavily)
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
      </div>
    </Panel>
  );
}
