"use client";

import Link from "next/link";
import { useState } from "react";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { useToast } from "@/components/notifications/ToastProvider";
import { promptsFromPreferences } from "@/lib/audit/resolve-prompts";
import { runAudit, updateWorkspace } from "@/lib/client/api";
import { getFixForGap, type GeoFixDefinition } from "@/lib/geo/fixes";
import { geoSnippetScriptTag } from "@/lib/geo/snippet";
import type { WorkspaceSnapshot } from "@/lib/dashboard";

type QuickFixModalProps = {
  isOpen: boolean;
  onClose: () => void;
  gap: string | null;
  workspace: WorkspaceSnapshot;
};

function buildAiPrompt(gap: string, domain: string, fix: GeoFixDefinition): string {
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
2. Adapt it to fit my existing project structure.
3. Provide the exact file(s) to modify and the final code to paste.
4. Confirm the change improves AI crawler readability.

${fix.instructions}

Please give me a step-by-step implementation with complete, production-ready code.`.trim();
}

export function QuickFixModal({ isOpen, onClose, gap, workspace }: QuickFixModalProps) {
  const [copied, setCopied] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"snippet" | "manual" | "ai">("snippet");
  const [saving, setSaving] = useState(false);
  const [applyingFramer, setApplyingFramer] = useState(false);

  const { refresh } = useWorkspaceContext();
  const toast = useToast();

  if (!isOpen || !gap || !workspace) return null;

  const domain = workspace.domain;
  const fix = getFixForGap(gap, domain);
  const workspaceId = workspace.workspaceId ?? workspace.id;
  if (!workspaceId) return null;

  const geoSnippetFixes =
    workspace.preferences?.geoSnippetFixes ??
    workspace.preferences?.appliedFixes ??
    [];
  const enabledInSnippet = geoSnippetFixes.includes(fix.id);
  const scriptTag = geoSnippetScriptTag(workspaceId);

  function handleCopy() {
    navigator.clipboard.writeText(fix.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleCopyScript() {
    navigator.clipboard.writeText(scriptTag);
    setScriptCopied(true);
    setTimeout(() => setScriptCopied(false), 2000);
  }

  function handleCopyPrompt() {
    navigator.clipboard.writeText(buildAiPrompt(gap!, domain, fix));
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2500);
  }

  async function persistSnippetFixes(nextFixes: string[]) {
    if (!workspaceId) {
      toast.error("Workspace ID not found.");
      return;
    }

    setSaving(true);
    try {
      await updateWorkspace(workspaceId, {
        preferences: {
          ...workspace.preferences,
          geoSnippetFixes: nextFixes,
          appliedFixes: nextFixes,
        },
      });

      toast.info("Re-scanning your site to verify the snippet…", {
        description: "Score updates only when the script is detected on your live homepage.",
      });

      const prompts = promptsFromPreferences(
        workspace.preferences ?? {},
        workspace.buyerQuestion,
      );

      await runAudit({
        domain: workspace.domain,
        prompts,
        workspaceId,
      });

      await refresh();
      toast.success(
        enabledInSnippet
          ? "Removed from GEO snippet bundle"
          : "Added to GEO snippet bundle",
      );
    } catch (err) {
      console.error(err);
      toast.error("Could not update GEO snippet settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleSnippetFix() {
    const next = enabledInSnippet
      ? geoSnippetFixes.filter((id) => id !== fix.id)
      : [...geoSnippetFixes, fix.id];
    await persistSnippetFixes(next);
  }

  async function handleApplyToFramer(publish: boolean) {
    if (!workspaceId) return;
    setApplyingFramer(true);
    try {
      const res = await fetch("/api/geo/apply-framer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, publish }),
      });
      const data = (await res.json()) as { error?: string; detail?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Could not apply snippet to Framer");
        return;
      }
      toast.success(data.detail ?? "Snippet added to Framer custom code");
      await persistSnippetFixes(
        enabledInSnippet
          ? geoSnippetFixes
          : [...new Set([...geoSnippetFixes, fix.id])],
      );
    } catch {
      toast.error("Network error applying snippet to Framer");
    } finally {
      setApplyingFramer(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#0f172a]/45 backdrop-blur-[3px]"
        aria-label="Close modal"
        onClick={onClose}
      />

      <div className="relative flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4.5">
          <div>
            <span className="rounded-full border border-rose-100 bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-500">
              Quick Fix
            </span>
            <h2 className="font-display mt-1 text-base font-bold leading-tight text-slate-900">
              {fix.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="flex border-b border-slate-100 bg-slate-50/50 px-6">
          <button
            type="button"
            onClick={() => setActiveTab("snippet")}
            className={`cursor-pointer border-b-2 py-3 text-xs font-bold transition-all ${
              activeTab === "snippet"
                ? "border-accent text-accent"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            GEO Snippet
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`ml-6 cursor-pointer border-b-2 py-3 text-xs font-bold transition-all ${
              activeTab === "manual"
                ? "border-accent text-accent"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Manual Code
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ai")}
            className={`ml-6 cursor-pointer border-b-2 py-3 text-xs font-bold transition-all ${
              activeTab === "ai"
                ? "border-violet-500 text-violet-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Ask AI
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {activeTab === "snippet" ? (
            fix.snippetCapable ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-5">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-slate-900">
                    Hosted GEO snippet
                  </h4>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    Add one script tag to your site head. CitePilot hosts the JSON-LD and
                    updates it when you toggle fixes here. Your theme files stay untouched —
                    remove the script anytime to undo.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-800">
                      Step 1 — Paste in site head
                    </h3>
                    <button
                      type="button"
                      onClick={handleCopyScript}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                        scriptCopied
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {scriptCopied ? "Copied!" : "Copy script tag"}
                    </button>
                  </div>
                  <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-[#0f172a] p-4 text-[11px] text-slate-200">
                    {scriptTag}
                  </pre>
                  <p className="text-xs text-slate-500">
                    Framer: Site Settings → Custom Code → Head end · Webflow: Site settings →
                    Custom code · WordPress: header plugin or theme · Any host: before{" "}
                    <code className="text-slate-700">&lt;/head&gt;</code>
                  </p>
                </div>

                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${enabledInSnippet ? "bg-emerald-500" : "bg-slate-300"}`}
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Step 2 — {enabledInSnippet ? "Included in snippet" : "Not in snippet yet"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleToggleSnippetFix()}
                    disabled={saving}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-accent px-5 py-3 text-xs font-bold text-white transition hover:opacity-95 disabled:opacity-50"
                  >
                    {saving
                      ? "Updating…"
                      : enabledInSnippet
                        ? "Remove from snippet bundle"
                        : "Include this fix in snippet"}
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <p className="text-xs font-semibold text-slate-800">Framer connected?</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Apply the script tag to Framer Custom Code automatically (does not publish
                    unless you choose).
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={applyingFramer}
                      onClick={() => void handleApplyToFramer(false)}
                      className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {applyingFramer ? "Applying…" : "Add to Framer (draft)"}
                    </button>
                    <button
                      type="button"
                      disabled={applyingFramer}
                      onClick={() => void handleApplyToFramer(true)}
                      className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-2 text-xs font-semibold text-accent hover:bg-accent/15 disabled:opacity-50"
                    >
                      Add & publish Framer
                    </button>
                  </div>
                  <Link
                    href="/dashboard/content?section=cms"
                    className="mt-3 inline-block text-xs font-semibold text-accent"
                  >
                    Connect Framer in CMS settings →
                  </Link>
                </div>

                <p className="text-xs leading-relaxed text-slate-500">
                  After the script is live, re-run your audit. Scores update only when we detect
                  the snippet on your homepage — never from toggling alone.
                </p>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-amber-900">
                    Manual fix required
                  </h4>
                  <p className="mt-2 text-xs leading-relaxed text-amber-900/80">
                    This gap ({fix.title.toLowerCase()}) cannot be safely auto-injected via a
                    hosted script. Use the <strong>Manual Code</strong> or <strong>Ask AI</strong>{" "}
                    tab to implement it on your site.
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  GEO Snippets support JSON-LD schema only (FAQ + Organization). Meta tags, H1,
                  robots.txt, and content changes need a direct edit in your CMS or codebase.
                </p>
              </div>
            )
          ) : activeTab === "ai" ? (
            <div className="space-y-5">
              <div className="flex gap-3 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50/40 p-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-lg text-violet-600">
                  🤖
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-slate-900">
                    AI-ready prompt
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    Paste into Cursor, ChatGPT, or Claude for step-by-step implementation.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-800">
                    Generated prompt
                  </h3>
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      promptCopied
                        ? "border-violet-200 bg-violet-50 text-violet-700"
                        : "border-violet-700 bg-violet-600 text-white hover:bg-violet-700"
                    }`}
                  >
                    {promptCopied ? "Copied!" : "Copy prompt"}
                  </button>
                </div>
                <pre className="max-h-52 overflow-auto rounded-xl border border-slate-200 bg-[#1e1b4b] p-4 text-[10.5px] font-mono leading-relaxed whitespace-pre-wrap text-indigo-100">
                  {buildAiPrompt(gap!, domain, fix)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <p className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-600">
                {fix.description}
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-800">
                    Copy code ({fix.filename})
                  </h3>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      copied
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-800 bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    {copied ? "Copied!" : "Copy code"}
                  </button>
                </div>
                <pre className="overflow-x-auto rounded-xl border border-slate-100 bg-[#0f172a] p-4 text-[11px] text-slate-200">
                  <code>{fix.code}</code>
                </pre>
              </div>

              <p className="rounded-xl border border-emerald-100/40 bg-emerald-50/40 p-4 text-xs leading-relaxed text-slate-600">
                {fix.instructions}
              </p>
            </div>
          )}
        </div>

        <footer className="flex justify-end border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
