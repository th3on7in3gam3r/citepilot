import type { BlogPost } from "@/lib/blog/types";

export const getCitedByChatgptPost: BlogPost = {
  slug: "how-to-get-cited-by-chatgpt",
  title: "How to Get Cited by ChatGPT (Without Gaming the Algorithm)",
  description:
    "A practical GEO playbook for founders and marketers who want ChatGPT to mention their brand when buyers ask real questions.",
  pillar: "geo",
  audience: "saas",
  contentType: "pillar",
  publishedAt: "2026-05-20",
  readingMinutes: 11,
  seoTitle: "How to Get Cited by ChatGPT | CitePilot",
  tldr:
    "ChatGPT cites brands that look like credible entities on the open web — not pages stuffed with keywords. You need clear answers to buyer questions, technical trust signals (schema, metadata, structure), and third-party mentions on sites LLMs already respect. This guide walks through a repeatable baseline → measure → fix loop.",
  sections: [
    {
      type: "h2",
      text: "What “being cited by ChatGPT” actually means",
    },
    {
      type: "p",
      text: "When someone asks ChatGPT “What’s the best CRM for agencies under 50 seats?”, the model synthesizes an answer from patterns in its training data and, for many queries, fresher retrieval signals. A citation isn’t a backlink — it’s your brand appearing as a recommended option with context. That requires topical relevance plus entity clarity: ChatGPT needs to understand who you are, what category you play in, and why you’re a reasonable answer for that prompt.",
    },
    {
      type: "callout",
      text: "Definition (GEO): Generative Engine Optimization is the practice of improving how often and how accurately AI assistants reference your brand on commercial and informational prompts.",
    },
    {
      type: "h2",
      text: "The baseline most teams skip",
    },
    {
      type: "p",
      text: "Before you publish another blog post, fix the pages that already should rank for your money prompts — usually your homepage, product page, and one comparison or “best X” article. According to common technical SEO practice (and what we see in CitePilot audits), the highest-leverage fixes are:",
    },
    {
      type: "ul",
      items: [
        "A 40–60 word answer capsule above the fold that directly answers your top buyer question",
        "FAQPage schema on pages that naturally host questions",
        "Organization JSON-LD with consistent name, URL, and description",
        "Internal links from high-traffic pages to the URL you want cited",
      ],
    },
    {
      type: "h2",
      text: "Step 1: Pick prompts that sound like real buyers",
    },
    {
      type: "p",
      text: "Vanity keywords won’t show up in ChatGPT the way your sales calls do. Track 10–50 prompts that mirror demo calls: alternatives, pricing, implementation, “best tool for…”. Tools like Ahrefs or Semrush help for Google; for AI surfaces you need prompt-level tracking — exactly what CitePilot is built for.",
    },
    {
      type: "h3",
      text: "Example prompts for a B2B SaaS",
    },
    {
      type: "ul",
      items: [
        "Best [category] software for [use case]",
        "[Competitor] alternatives for [audience]",
        "How to evaluate [category] tools in 2026",
      ],
    },
    {
      type: "h2",
      text: "Step 2: Make your site quotable",
    },
    {
      type: "p",
      text: "LLMs extract concise, declarative sentences. Write definition blocks, numbered steps, and comparison tables. Cite statistics with sources — “According to SparkToro’s 2024 research…” beats “studies show” every time. If your page is thin or vague, models default to brands with stronger entity signals elsewhere.",
    },
    {
      type: "h2",
      text: "Step 3: Earn mentions where models already look",
    },
    {
      type: "p",
      text: "Reddit isn’t the only signal — and API access is restricted for many builders. High-signal alternatives include Hacker News threads, Stack Overflow answers, niche newsletters, and comparison roundups on DR 40+ marketing blogs. Show up where your buyers already ask questions; don’t spray generic comments.",
    },
    {
      type: "h2",
      text: "Measure citation lift, not vibes",
    },
    {
      type: "p",
      text: "Run a baseline audit on your domain and top prompts. Ship one fix — schema, answer capsule, or comparison page — then re-scan in 7 days. If your cited prompt count doesn’t move, you’re either targeting the wrong prompt or the wrong page. Dashboards that only show a “GEO score” without prompt-level deltas are decoration.",
    },
  ],
  faqs: [
    {
      q: "How long does it take to get cited by ChatGPT?",
      a: "Technical fixes can influence retrieval-friendly pages within weeks, but competitive prompts may take multiple content and mention cycles. Track specific prompts rather than waiting for sitewide traffic spikes.",
    },
    {
      q: "Do I need separate content for ChatGPT vs Google?",
      a: "No — the overlap is large. Pages that answer buyer questions clearly, with schema and authority signals, tend to perform on both. Optimize for extractable answers first.",
    },
    {
      q: "Can I pay to be cited by ChatGPT?",
      a: "There’s no paid inclusion for organic answers. Sponsored placements in other channels may indirectly help entity recognition, but citations come from relevance and trust signals.",
    },
    {
      q: "What tools track AI citations?",
      a: "Emerging GEO platforms (including CitePilot) focus on prompt-level citation tracking. Traditional rank trackers alone won’t show ChatGPT visibility.",
    },
  ],
  takeaways: [
    "Track buyer questions, not vanity keywords.",
    "Fix homepage and product pages before scaling content volume.",
    "Use schema, answer capsules, and FAQ blocks so models can quote you.",
    "Earn mentions on HN, Stack Overflow, and authoritative publications.",
    "Re-scan after every fix — prove lift per prompt.",
  ],
};
