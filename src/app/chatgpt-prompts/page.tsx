import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ChatGptPromptsJsonLd } from "@/components/marketing/chatgpt-prompts/ChatGptPromptsJsonLd";
import { ChatGptPromptsLanding } from "@/components/marketing/ChatGptPromptsLanding";
import { chatgptPromptsLanding } from "@/lib/marketing/chatgpt-prompts-landing";
import { clampMetaDescription } from "@/lib/seo/meta";
import { site } from "@/lib/site";

export const revalidate = 3600;

const pageUrl = `${site.url.replace(/\/$/, "")}${chatgptPromptsLanding.path}`;

export const metadata: Metadata = {
  title: chatgptPromptsLanding.shortTitle,
  description: clampMetaDescription(chatgptPromptsLanding.description),
  alternates: { canonical: chatgptPromptsLanding.path },
  openGraph: {
    title: chatgptPromptsLanding.title,
    description: clampMetaDescription(chatgptPromptsLanding.description),
    url: pageUrl,
    type: "article",
    modifiedTime: chatgptPromptsLanding.dateModified,
  },
  twitter: {
    title: chatgptPromptsLanding.shortTitle,
    description: clampMetaDescription(chatgptPromptsLanding.description),
  },
};

export default function ChatGptPromptsPage() {
  return (
    <>
      <ChatGptPromptsJsonLd />
      <Header />
      <main id="main-content" tabIndex={-1}>
        <ChatGptPromptsLanding />
      </main>
      <Footer />
    </>
  );
}
