import { CompetitorsSeoIntro } from "@/components/dashboard/CompetitorsSeoIntro";
import { CompetitorsPageClient } from "./CompetitorsPageClient";

export default function CompetitorsPage() {
  return (
    <>
      <CompetitorsSeoIntro section="header" />
      <CompetitorsPageClient />
      <CompetitorsSeoIntro section="footer" />
    </>
  );
}
