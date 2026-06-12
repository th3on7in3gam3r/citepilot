import { Panel } from "@/components/dashboard/DashboardUI";
import Link from "next/link";

type GeoAuditSeoIntroProps = {
  /** `header` renders above the workspace UI; `footer` renders deep sections below it. */
  section?: "header" | "footer";
};

/** Server-rendered GEO audit overview for SEO and orientation. */
export function GeoAuditSeoIntro({ section = "header" }: GeoAuditSeoIntroProps) {
  if (section === "footer") {
    return (
      <Panel className="mt-10">
        <div className="space-y-8 text-sm leading-relaxed text-muted">
          <section>
            <h2 className="font-display text-lg font-bold text-ink">
              Shareable audit reports and proof exports
            </h2>
            <p className="mt-2">
              Share audit links and proof reports with stakeholders who need
              citation evidence without dashboard access. Fleet workspaces can
              white-label exports from{" "}
              <Link href="/dashboard/settings" className="font-semibold text-accent">
                Settings
              </Link>
              . For client-ready PDFs, open the{" "}
              <Link href="/report/proof" className="font-semibold text-accent">
                proof report
              </Link>{" "}
              after a live audit completes.
            </p>
            <p className="mt-2">
              The public{" "}
              <Link href="/audit" className="font-semibold text-accent">
                free citation audit
              </Link>{" "}
              uses the same engine diagnostic — ideal for prospects before they
              join a workspace. Paid plans add weekly Monday rescans, delta
              tracking, and Autopilot fix plans on top of this technical baseline.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-ink">
              Related workspace tools
            </h2>
            <p className="mt-2">
              Turn priority fixes into articles on{" "}
              <Link href="/dashboard/content" className="font-semibold text-accent">
                Content
              </Link>
              , build authority on{" "}
              <Link href="/dashboard/backlinks" className="font-semibold text-accent">
                Backlinks
              </Link>
              , and track prompt-level lift in{" "}
              <Link href="/dashboard/analytics" className="font-semibold text-accent">
                Analytics
              </Link>
              . For structured data and entity optimization, follow the{" "}
              <Link href="/geo-playbook" className="font-semibold text-accent">
                GEO Playbook
              </Link>{" "}
              or the{" "}
              <Link href="/ai-visibility" className="font-semibold text-accent">
                AI visibility
              </Link>{" "}
              service overview.
            </p>
            <h3 className="mt-4 font-semibold text-ink">GEO audit checklist</h3>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Enter 5–10 money prompts per audit, not generic head terms.</li>
              <li>Fix FAQ schema and answer capsules before scaling blog volume.</li>
              <li>Re-scan after publish; citation lift is measured per prompt.</li>
              <li>Enable weekly Monday rescans on Pilot+ for automatic deltas.</li>
            </ul>
          </section>

          <section aria-labelledby="geo-audit-faq">
            <h2
              id="geo-audit-faq"
              className="font-display text-lg font-bold text-ink"
            >
              GEO audit workspace FAQ
            </h2>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="font-semibold text-ink">
                  What does the GEO score measure?
                </dt>
                <dd className="mt-1">
                  On-page readiness for generative retrieval: title and meta
                  quality, JSON-LD and FAQPage schema, sitemap discovery, word
                  count, and answer formatting patterns LLMs extract into
                  synthesized responses.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">
                  Which AI engines are checked per audit?
                </dt>
                <dd className="mt-1">
                  Eight surfaces — ChatGPT, Perplexity, Google AI Overviews,
                  Gemini, Copilot, Claude, Grok, and DeepSeek. Live API probes
                  run where keys are configured; remaining engines use
                  GEO-informed inference from your site signals.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">
                  How often should I re-audit?
                </dt>
                <dd className="mt-1">
                  Within seven days of shipping a major fix or new comparison page.
                  Pilot+ enables automatic Monday rescans so citation deltas update
                  without manual reruns.
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
        Technical GEO audit for AI citations
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted md:text-base">
        The CitePilot GEO audit workspace combines technical site signals with
        live and simulated citation checks across ChatGPT, Perplexity, Google AI
        Overviews, and other answer surfaces. Use it to see whether your pages
        are structured for generative retrieval, which money prompts cite your
        brand, and which fixes will move citation share fastest.
      </p>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted md:text-base">
        Run audits from the workspace below or start with the public{" "}
        <Link href="/audit" className="font-semibold text-accent">
          60-second citation audit
        </Link>{" "}
        if you have not baselined your domain yet. Results feed your{" "}
        <Link href="/dashboard" className="font-semibold text-accent">
          dashboard overview
        </Link>
        , weekly rescans on Pilot+, and proof exports for stakeholders.
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            GEO score, site signals, and platform coverage
          </h2>
          <p className="mt-2">
            Your GEO score summarizes on-page readiness: title and meta description
            quality, JSON-LD and FAQ schema, sitemap discovery, word count, and
            answer formatting patterns that LLMs extract. Platform coverage shows
            how many AI surfaces mentioned your domain on the prompts in your
            latest audit — not vanity rankings, but prompt-level presence tied to
            buyer intent.
          </p>
          <p className="mt-2">
            Site signals update when you run a new audit from this page or the
            public audit tool. Compare scores over time on Overview and{" "}
            <Link href="/dashboard/analytics" className="font-semibold text-accent">
              Analytics
            </Link>{" "}
            after each rescan to confirm lift.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            Priority fixes and citation gaps
          </h2>
          <p className="mt-2">
            Priority fixes are ranked gaps from your latest audit — missing schema,
            weak answer capsules, thin comparison pages, or competitor wins on
            specific prompts. Each item can be explained in plain language with
            CitePilot Insights (Pilot+, or one free preview on Free). Turn fixes
            into content briefs on Content or authority placements on Backlinks
            when the gap needs off-site proof.
          </p>
          <p className="mt-2">
            Add competitors in{" "}
            <Link href="/dashboard/settings" className="font-semibold text-accent">
              Settings
            </Link>{" "}
            so benchmark emails and gap lists reference the brands buyers actually
            see in AI answers. Re-audit within seven days of shipping a fix to
            verify the prompt moved.
          </p>
        </section>
      </div>
    </Panel>
  );
}
