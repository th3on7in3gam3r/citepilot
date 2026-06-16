import { Panel } from "@/components/dashboard/DashboardUI";
import Link from "next/link";

type CompetitorsSeoIntroProps = {
  section?: "header" | "footer";
};

export function CompetitorsSeoIntro({ section = "header" }: CompetitorsSeoIntroProps) {
  if (section === "footer") {
    return (
      <Panel className="mt-10">
        <div className="space-y-6 text-sm leading-relaxed text-muted">
          <section>
            <h2 className="font-display text-lg font-bold text-ink">
              Turn competitive gaps into citation wins
            </h2>
            <p className="mt-2">
              Competitor intelligence connects audit data to action: fix gaps on{" "}
              <Link href="/dashboard/geo-audit" className="font-semibold text-accent">
                GEO Audit
              </Link>
              , publish targeted content on{" "}
              <Link href="/dashboard/content" className="font-semibold text-accent">
                Content
              </Link>
              , and prove movement on{" "}
              <Link href="/dashboard/analytics" className="font-semibold text-accent">
                Analytics
              </Link>
              . Enable competitor gain alerts in{" "}
              <Link href="/dashboard/settings" className="font-semibold text-accent">
                Settings
              </Link>{" "}
              when rivals overtake you on money prompts.
            </p>
          </section>
        </div>
      </Panel>
    );
  }

  return (
    <p className="sr-only">
      Competitor citation intelligence — track rivals, compare prompt gaps, and steal
      citations with GEO recommendations.
    </p>
  );
}
