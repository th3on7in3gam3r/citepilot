import { DiscussionsSeoIntro } from "@/components/dashboard/DiscussionsSeoIntro";
import { DiscussionsPageClient } from "./DiscussionsPageClient";

export default function DiscussionsPage() {
  return (
    <>
      <DiscussionsSeoIntro section="header" />
      <DiscussionsPageClient />
      <DiscussionsSeoIntro section="footer" />
    </>
  );
}
