import { DiscussionsSeoIntro } from "@/components/dashboard/DiscussionsSeoIntro";
import type { Metadata } from "next";
import { DiscussionsPageClient } from "./DiscussionsPageClient";

export const metadata: Metadata = {
  title: "Buyer Discussion Radar for GEO",
  description:
    "Find buyer-intent threads on Hacker News, Stack Overflow & the web for GEO research — map money prompts, spot competitors, and turn discussions into citations.",
};

export default function DiscussionsPage() {
  return (
    <>
      <DiscussionsPageClient />
      <DiscussionsSeoIntro />
    </>
  );
}
