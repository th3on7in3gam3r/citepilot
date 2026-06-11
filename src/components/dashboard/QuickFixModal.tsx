"use client";

import { useState } from "react";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { useToast } from "@/components/notifications/ToastProvider";
import { promptsFromPreferences } from "@/lib/audit/resolve-prompts";
import { runAudit, updateWorkspace } from "@/lib/client/api";
import type { WorkspaceSnapshot } from "@/lib/dashboard";

type QuickFixModalProps = {
  isOpen: boolean;
  onClose: () => void;
  gap: string | null;
  workspace: WorkspaceSnapshot;
};

/** Build a ready-to-paste AI prompt for this specific fix */
function buildAiPrompt(gap: string, domain: string, fix: ReturnType<typeof getFixDetails>): string {
  return `You are a senior web developer helping me fix a GEO (Generative Engine Optimization) issue on my website.

## Context
- **Website domain**: ${domain}
- **Issue identified**: ${gap}
- **Fix title**: ${fix.title}

## What needs to be fixed
${fix.description}

## Recommended implementation
The following code snippet should be added to ${fix.filename}:

\`\`\`${fix.type === "json" ? "html" : fix.type}
${fix.code}
\`\`\`

## Your task
1. Review the code snippet above.
2. Adapt it to fit my existing project structure (e.g., Next.js App Router, React, or plain HTML — use the context of my codebase).
3. Provide the exact file(s) to modify or create, the precise location in each file, and the final code to paste.
4. Confirm the change makes my site detectable by AI crawlers (GPTBot, ClaudeBot, PerplexityBot) and optimizes for citations in ChatGPT, Perplexity, and Google AI Overviews.

${fix.instructions}

Please give me a step-by-step implementation with the complete, production-ready code.`.trim();
}

export function QuickFixModal({ isOpen, onClose, gap, workspace }: QuickFixModalProps) {
  const [copied, setCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"auto" | "manual" | "ai">("auto");
  const [applying, setApplying] = useState(false);

  const { refresh } = useWorkspaceContext();
  const toast = useToast();

  if (!isOpen || !gap || !workspace) return null;

  const domain = workspace.domain;
  const fix = getFixDetails(gap, domain);

  const appliedFixes = workspace.preferences?.appliedFixes ?? [];
  const isApplied = appliedFixes.includes(fix.id);
  const workspaceId = workspace.workspaceId ?? workspace.id;

  function handleCopy() {
    navigator.clipboard.writeText(fix.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleCopyPrompt() {
    const aiPrompt = buildAiPrompt(gap!, domain, fix);
    navigator.clipboard.writeText(aiPrompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2500);
  }

  async function handleToggleAutoFix() {
    if (!workspaceId) {
      toast.error("Workspace ID not found. Onboarding may be incomplete.");
      return;
    }

    setApplying(true);
    const nextApplied = isApplied
      ? appliedFixes.filter((id) => id !== fix.id)
      : [...appliedFixes, fix.id];

    try {
      // 1. PATCH the workspace preferences
      await updateWorkspace(workspaceId, {
        preferences: {
          ...workspace.preferences,
          appliedFixes: nextApplied,
        },
      });

      // 2. Re-run technical/GEO audit to update scores immediately
      toast.info(
        isApplied
          ? "Removing fix and re-evaluating GEO score..."
          : "Applying fix and re-evaluating GEO score...",
        { description: "This takes just a few seconds." }
      );

      const prompts = promptsFromPreferences(
        workspace.preferences ?? {},
        workspace.buyerQuestion,
      );

      await runAudit({
        domain: workspace.domain,
        prompts,
        workspaceId,
      });

      // 3. Refresh context so the dashboard updates
      await refresh();

      toast.success(
        isApplied
          ? "Dynamic fix removed!"
          : "Dynamic fix applied successfully!"
      );
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while updating the fix.");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-[#0f172a]/45 backdrop-blur-[3px] transition-opacity duration-300"
        aria-label="Close modal"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative max-h-[85vh] w-full max-w-xl overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl transition-all duration-300 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4.5 bg-gradient-to-r from-slate-50 to-white">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">
              Quick Fix Action
            </span>
            <h2 className="mt-1 font-display text-base font-bold text-slate-900 leading-tight">
              {fix.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setActiveTab("auto")}
            className={`flex items-center gap-1.5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "auto"
                ? "border-accent text-accent"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            ⚡ 1-Click Auto-Fix
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`ml-6 flex items-center gap-1.5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "manual"
                ? "border-accent text-accent"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            📋 Manual Code
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ai")}
            className={`ml-6 flex items-center gap-1.5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "ai"
                ? "border-violet-500 text-violet-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            🤖 Ask AI
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === "ai" ? (
            <div className="space-y-5">
              {/* Intro banner */}
              <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50/40 p-5 flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 text-lg">
                  🤖
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">AI-Ready Prompt</h4>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Copy the prompt below and paste it into any AI assistant or IDE to get a step-by-step implementation tailored to your codebase.
                  </p>
                </div>
              </div>

              {/* Compatible platforms */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Works in</h3>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { label: "ChatGPT", color: "bg-emerald-50 border-emerald-100 text-emerald-700" },
                      { label: "Claude", color: "bg-orange-50 border-orange-100 text-orange-700" },
                      { label: "Gemini", color: "bg-blue-50 border-blue-100 text-blue-700" },
                      { label: "Cursor", color: "bg-slate-100 border-slate-200 text-slate-700" },
                      { label: "GitHub Copilot", color: "bg-slate-100 border-slate-200 text-slate-700" },
                      { label: "Perplexity", color: "bg-teal-50 border-teal-100 text-teal-700" },
                      { label: "Terminal / CLI", color: "bg-slate-900 border-slate-800 text-slate-200" },
                    ] as { label: string; color: string }[]
                  ).map(({ label, color }) => (
                    <span
                      key={label}
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[10px] font-semibold tracking-wide ${color}`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Generated prompt block */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wide">Generated Prompt</h3>
                  <button
                    type="button"
                    id="copy-ai-prompt-btn"
                    onClick={handleCopyPrompt}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200 ${
                      promptCopied
                        ? "bg-violet-50 border-violet-200 text-violet-700 scale-95"
                        : "bg-violet-600 border-violet-700 text-white hover:bg-violet-700 shadow-sm hover:scale-[1.02]"
                    }`}
                  >
                    {promptCopied ? (
                      <>
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Copy Prompt
                      </>
                    )}
                  </button>
                </div>

                <div className="relative rounded-xl border border-slate-200 bg-[#1e1b4b] shadow-[inset_0_2px_4px_rgba(0,0,0,0.12)] overflow-hidden">
                  <pre
                    className="overflow-x-auto overflow-y-auto max-h-52 p-4 text-[10.5px] font-mono leading-relaxed text-indigo-100 select-all whitespace-pre-wrap"
                    aria-label="AI prompt to copy"
                  >
                    {buildAiPrompt(gap!, domain, fix)}
                  </pre>
                </div>
              </div>

              {/* Pro tip */}
              <div className="flex gap-3 text-xs text-slate-600 leading-relaxed bg-violet-50/60 border border-violet-100/60 p-4 rounded-xl">
                <span className="text-base leading-none shrink-0">💡</span>
                <p className="flex-1">
                  <strong>Pro tip:</strong> In <strong>Cursor</strong> or <strong>VS Code + Copilot</strong>, open a new chat, paste the prompt, and attach your target file for precise in-editor edits. In <strong>ChatGPT / Claude</strong>, just paste and send.
                </p>
              </div>
            </div>
          ) : activeTab === "auto" ? (
            <div className="space-y-4 py-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Dynamic Code Injection
                    </h4>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                      Let CitePilot dynamically apply this GEO optimization to your site. 
                      Once active, our auditing engine immediately detects the fix to verify completion and boost your citation confidence.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-6 border border-dashed border-slate-200 rounded-2xl bg-white space-y-4">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${isApplied ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Status: {isApplied ? "Active & Optimizing" : "Not Applied"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleToggleAutoFix}
                  disabled={applying}
                  className={`inline-flex items-center justify-center gap-2 w-full max-w-xs px-5 py-3 rounded-xl text-xs font-bold transition-all duration-200 shadow-md ${
                    isApplied
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                      : "bg-accent hover:bg-accent-deep text-white hover:scale-[1.02]"
                  } disabled:opacity-50`}
                >
                  {applying ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin text-current" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Updating audit...
                    </span>
                  ) : isApplied ? (
                    <>Remove Dynamic Fix</>
                  ) : (
                    <>⚡ Apply Auto-Fix Dynamically</>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Explanation */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                  Why this is needed
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                  {fix.description}
                </p>
              </div>

              {/* Copy-Paste Code Block */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                    Copy Code Snippet ({fix.filename})
                  </h3>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150 ${
                      copied
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-slate-900 border-slate-800 text-white hover:bg-slate-800 shadow-sm"
                    }`}
                  >
                    {copied ? (
                      <>
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        Copy to Clipboard
                      </>
                    )}
                  </button>
                </div>

                <div className="relative rounded-xl border border-slate-100 bg-[#0f172a] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] overflow-hidden">
                  <pre className="overflow-x-auto p-4 text-[11px] font-mono leading-relaxed text-slate-200 select-all">
                    <code>{fix.code}</code>
                  </pre>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                  Where to paste it
                </h3>
                <div className="flex gap-3 text-xs text-slate-600 leading-relaxed bg-emerald-50/40 border border-emerald-100/40 p-4 rounded-xl">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                    !
                  </div>
                  <p className="flex-1">{fix.instructions}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex justify-end border-t border-slate-100 px-6 py-4 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}


function getFixDetails(gap: string, domain: string) {
  const lowercaseGap = gap.toLowerCase();

  if (lowercaseGap.includes("faqpage") || lowercaseGap.includes("faq schema")) {
    return {
      id: "faq-schema",
      title: "Add FAQPage Schema (JSON-LD)",
      description: "AI search engines (like ChatGPT and Perplexity) use FAQ schema to read direct answers to common user questions about your site.",
      instructions: "Customize the questions and answers in the script below to match your brand, copy the code, and paste it inside the <head> section of your landing pages.",
      filename: "landing-page-header",
      code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is ${domain}?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "${domain} is a premium solution designed to solve key problems for our customers efficiently and reliably."
      }
    },
    {
      "@type": "Question",
      "name": "How does ${domain} compare to competitors?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "${domain} offers superior performance, better value, and a highly intuitive user interface compared to alternative options."
      }
    }
  ]
}
</script>`,
      type: "json",
    };
  }

  if (lowercaseGap.includes("organization") || lowercaseGap.includes("json-ld") || lowercaseGap.includes("entity")) {
    const brandName = domain.split(".")[0] || "YourBrand";
    const formattedBrand = brandName.charAt(0).toUpperCase() + brandName.slice(1);
    return {
      id: "org-schema",
      title: "Add Organization Schema (JSON-LD)",
      description: "Organization schema defines your brand as a structured entity. This allows AI models to verify facts about your brand with high confidence.",
      instructions: "Customize the organization details, copy the code, and paste it inside the <head> section of your homepage.",
      filename: "homepage-header",
      code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "${formattedBrand}",
  "url": "https://${domain}",
  "logo": "https://${domain}/logo.png",
  "sameAs": [
    "https://twitter.com/${brandName}",
    "https://linkedin.com/company/${brandName}"
  ],
  "description": "${formattedBrand} is a premium brand providing next-generation services."
}
</script>`,
      type: "json",
    };
  }

  if (lowercaseGap.includes("meta description")) {
    const brandName = domain.split(".")[0] || "YourBrand";
    const formattedBrand = brandName.charAt(0).toUpperCase() + brandName.slice(1);
    return {
      id: "meta-description",
      title: "Add Meta Description Tag",
      description: "A meta description provides a concise summary of your page. AI search crawlers use this to construct summaries of your brand.",
      instructions: "Paste this meta tag inside the <head> section of your homepage HTML (typically in layout.tsx, index.html, or next-head).",
      filename: "index.html / layout.tsx",
      code: `<meta name="description" content="Welcome to ${formattedBrand} - the leading platform for next-generation automated services and growth engines." />`,
      type: "html",
    };
  }

  if (lowercaseGap.includes("h1")) {
    const brandName = domain.split(".")[0] || "YourBrand";
    const formattedBrand = brandName.charAt(0).toUpperCase() + brandName.slice(1);
    return {
      id: "h1",
      title: "Add H1 Heading",
      description: "An H1 heading acts as the primary title of the page. Crawlers use it to understand the page's core value proposition.",
      instructions: "Place this tag at the very top of your main page body content (inside the <body> tag). Make sure it's the only <h1> tag on the page.",
      filename: "page.tsx / index.html",
      code: `<h1 className="text-4xl font-bold font-display text-slate-900 tracking-tight">
  Welcome to ${formattedBrand} - Premium Business Solutions
</h1>`,
      type: "html",
    };
  }

  if (lowercaseGap.includes("robots.txt") || lowercaseGap.includes("block crawlers")) {
    return {
      id: "robots",
      title: "Optimize robots.txt AI Bot Access",
      description: "AI bots (like GPTBot or ClaudeBot) read robots.txt to verify if they have permission to scan your content for AI responses.",
      instructions: "Create a robots.txt file in your project's public/ directory (or root) and paste these instructions.",
      filename: "public/robots.txt",
      code: `# Allow all search engine and AI crawlers
User-agent: *
Allow: /

# Explicitly welcome AI user agents
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /`,
      type: "text",
    };
  }

  if (lowercaseGap.includes("sitemap")) {
    return {
      id: "sitemap",
      title: "Create sitemap.xml",
      description: "A sitemap acts as a map of your website's pages, allowing AI search systems to index all your target comparison pages rapidly.",
      instructions: "Create a sitemap.xml file in your project's public/ directory (or root) and paste this structure.",
      filename: "public/sitemap.xml",
      code: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://${domain}/</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`,
      type: "xml",
    };
  }

  if (lowercaseGap.includes("thin") || lowercaseGap.includes("words") || lowercaseGap.includes("content")) {
    const brandName = domain.split(".")[0] || "YourBrand";
    const formattedBrand = brandName.charAt(0).toUpperCase() + brandName.slice(1);
    return {
      id: "content",
      title: "Add above-the-fold Answer Capsule",
      description: "AI engines favor answer capsules: short, high-density content blocks of 40-60 words containing structured information.",
      instructions: "Place this answer capsule component high up on your homepage (above the fold) to let search engines extract your core entities.",
      filename: "page.tsx / index.html",
      code: `<div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 my-6">
  <h2 className="text-sm font-semibold text-slate-900 mb-2">What is ${formattedBrand}?</h2>
  <p className="text-xs text-slate-600 leading-relaxed">
    ${formattedBrand} is a leading B2B platform helping modern teams audit, track, and optimize their search presence across Google and AI search engines like ChatGPT, Perplexity, and Gemini.
  </p>
</div>`,
      type: "html",
    };
  }

  const brandName = domain.split(".")[0] || "YourBrand";
  const formattedBrand = brandName.charAt(0).toUpperCase() + brandName.slice(1);
  return {
    id: "custom-content",
    title: "GEO Optimization Action Guide",
    description: "Write structured content matching the target query to help LLM citation retrievers find and recommend your brand.",
    instructions: "Write a high-quality blog post or landing page addressing this target topic directly. Structure it with clear, informative headings.",
    filename: "content-strategy",
    code: `# Target Query: "${gap}"

## Key Content Requirements:
1. Explain the target question directly in the first paragraph.
2. Structure the comparison or alternatives logically (using tables or comparison blocks).
3. Mention your brand name (${formattedBrand}) and include clear citations.`,
    type: "text",
  };
}
