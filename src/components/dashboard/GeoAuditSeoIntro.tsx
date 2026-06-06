import { Panel } from "@/components/dashboard/DashboardUI";
import Link from "next/link";

/** Server-rendered GEO audit overview for SEO and orientation. */
export function GeoAuditSeoIntro() {
  return (
    <Panel className="mt-10">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
        Technical GEO audit for AI citations
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted md:text-base">
        The CitePilot GEO audit workspace combines technical site signals with
        live and simulated citation checks across ChatGPT, Perplexity, Google AI
        Overviews, and other answer surfaces. Use it to see whether your pages are
        structured for generative retrieval, which money prompts cite your brand,
        and which fixes will move citation share fastest.
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            GEO score, site signals & platform coverage
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
            Site signals update when you run a new audit from this page or the{" "}
            <Link href="/audit" className="font-semibold text-accent">
              public audit tool
            </Link>
            . Compare scores over time on{" "}
            <Link href="/dashboard" className="font-semibold text-accent">
              Overview
            </Link>{" "}
            and{" "}
            <Link href="/dashboard/analytics" className="font-semibold text-accent">
              Analytics
            </Link>{" "}
            after each rescan to confirm lift.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            Priority fixes & citation gaps
          </h2>
          <p className="mt-2">
            Priority fixes are ranked gaps from your latest audit — missing schema,
            weak answer capsules, thin comparison pages, or competitor wins on
            specific prompts. Each item can be explained in plain language with
            CitePilot Insights (Pilot+, or one free preview on Free). Turn fixes
            into content briefs on{" "}
            <Link href="/dashboard/content" className="font-semibold text-accent">
              Content
            </Link>{" "}
            or authority placements on{" "}
            <Link href="/dashboard/backlinks" className="font-semibold text-accent">
              Backlinks
            </Link>{" "}
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

        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            Shareable audit reports & proof exports
          </h2>
          <p className="mt-2">
            Share audit links and proof reports with stakeholders who need
            citation evidence without dashboard access. Fleet workspaces can
            white-label exports from Settings. For client-ready PDFs, open the{" "}
            <Link href="/report/proof" className="font-semibold text-accent">
              proof report
            </Link>{" "}
            after a live audit completes.
          </p>
          <h3 className="mt-4 font-semibold text-ink">Audit checklist</h3>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Enter 5–10 money prompts per audit, not generic head terms.</li>
            <li>Fix FAQ schema and answer capsules before scaling blog volume.</li>
            <li>Re-scan after publish; citation lift is measured per prompt.</li>
            <li>Enable weekly Monday rescans on Pilot+ for automatic deltas.</li>
          </ul>
        </section>
      </div>
    </Panel>
  );
}
