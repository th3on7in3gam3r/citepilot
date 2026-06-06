import { ContentSeoIntro } from "@/components/dashboard/ContentSeoIntro";
import { ContentPageClient } from "./ContentPageClient";

export default function ContentPage() {
  return (
    <>
      <ContentSeoIntro section="header" />
      <ContentPageClient />
      <ContentSeoIntro section="footer" />
    </>
  );
}
