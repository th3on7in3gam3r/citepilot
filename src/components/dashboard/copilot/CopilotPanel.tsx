"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCopilot } from "@/components/dashboard/copilot/CopilotProvider";
import { useGridFilter } from "@/components/dashboard/copilot/GridFilterProvider";
import { WidgetConfigPanel } from "@/components/dashboard/copilot/WidgetConfigPanel";
import { COPILOT_SUGGESTIONS } from "@/lib/copilot/widgets";

const FILTER_SUGGESTIONS = [
  "Show competitors ranking higher than my site with fewer page views",
  "Filter H1 contains marketing",
  "ND Score larger than 90 and CPC larger than 1.00",
];

function highlightPromptTerms(text: string): ReactNode {
  const re =
    /\b(dashboard widget|vertical bars|organic vs paid|filter|nd score|h1 contains|page views|ranking higher|keywords?|competitors?|visibility|traffic)\b/gi;
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    nodes.push(
      <mark key={key++} className="rounded bg-[#e0f2fe] px-0.5 text-[#0284c7]">
        {match[0]}
      </mark>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes.length ? nodes : text;
}

export function CopilotPanel() {
  const {
    isOpen,
    closeCopilot,
    messages,
    agentStatus,
    widgets,
    selectedWidgetId,
    editingWidget,
    setEditingWidget,
    sendPrompt,
    pauseAgent,
    resumeAgent,
    updateWidget,
    removeWidget,
  } = useCopilot();
  const { tableLabel, filters, setFilterModalOpen } = useGridFilter();
  const activeFilterCount = filters.filter((f) => !f.generating && (f.operator === "is_empty" || f.value.trim())).length;

  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const selectedWidget = useMemo(
    () => widgets.find((w) => w.id === selectedWidgetId) ?? null,
    [widgets, selectedWidgetId],
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, editingWidget]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || agentStatus === "running") return;
    setInput("");
    setShowSuggestions(false);
    await sendPrompt(text);
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] lg:bg-black/10"
        aria-label="Close Copilot"
        onClick={closeCopilot}
      />

      <aside className="fixed top-0 right-0 z-50 flex h-[100dvh] w-full max-w-md flex-col border-l border-[#e8edf3] bg-white shadow-2xl">
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b border-[#eef2f6] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#0c1512] text-[#0ea5e9]">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="5" r="1.5" />
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="19" cy="5" r="1.5" />
                <circle cx="5" cy="12" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="19" cy="12" r="1.5" />
                <circle cx="5" cy="19" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
                <circle cx="19" cy="19" r="1.5" />
              </svg>
            </span>
            <span className="font-display text-sm font-bold text-[#0f172a]">
              CitePilot Copilot
            </span>
          </div>
          <button
            type="button"
            onClick={closeCopilot}
            className="rounded-lg p-2 text-[#94a3b8] hover:bg-[#f8fafb] hover:text-[#0f172a]"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* Hero (first visit) */}
        {messages.length <= 1 && (
          <div className="shrink-0 border-b border-[#eef2f6] bg-gradient-to-b from-[#e0f2fe]/40 to-white px-4 py-5">
            <div className="mx-auto mb-3 flex h-24 w-full max-w-[200px] items-center justify-center rounded-2xl bg-[#f8fafb]">
              <span className="text-4xl" aria-hidden>
                ✦
              </span>
            </div>
            <p className="text-center text-sm font-semibold text-[#0f172a]">
              Your AI SEO cockpit builder
            </p>
            <ul className="mt-3 space-y-1.5 text-xs text-[#64748b]">
              <li>• Generate dynamic analytics dashboards</li>
              <li>• Build multi-condition filters for data grids</li>
              <li>• Analyze competitor rankings and citations</li>
            </ul>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-4">
            {messages.map((msg) => {
              if (msg.role === "user") {
                return (
                  <div key={msg.id} className="text-right">
                    <p className="inline-block max-w-[90%] rounded-2xl rounded-tr-sm bg-[#0c1512] px-4 py-2.5 text-left text-sm text-white">
                      {highlightPromptTerms(msg.text)}
                    </p>
                    <p className="mt-1 text-[10px] text-[#94a3b8]">{msg.time}</p>
                  </div>
                );
              }
              if (msg.role === "status") {
                return (
                  <div
                    key={msg.id}
                    className="flex items-center gap-2 text-xs text-[#64748b]"
                  >
                    {msg.done ? (
                      <span className="text-[#0ea5e9]">✓</span>
                    ) : (
                      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#0ea5e9] border-t-transparent" />
                    )}
                    <span>{msg.text}</span>
                    {msg.duration && (
                      <span className="text-[#94a3b8]">· {msg.duration}</span>
                    )}
                  </div>
                );
              }
              return (
                <div key={msg.id}>
                  <p className="text-sm leading-relaxed text-[#334155]">{msg.text}</p>
                  <p className="mt-1 text-[10px] text-[#94a3b8]">{msg.time}</p>
                </div>
              );
            })}
          </div>

          {editingWidget && selectedWidget && (
            <div className="mt-4">
              <WidgetConfigPanel
                widget={selectedWidget}
                onChange={(patch) => updateWidget(selectedWidget.id, patch)}
                onDelete={() => {
                  removeWidget(selectedWidget.id);
                  setEditingWidget(false);
                }}
                onClose={() => setEditingWidget(false)}
              />
            </div>
          )}
        </div>

        {/* Agent status */}
        <div className="shrink-0 border-t border-[#eef2f6] bg-[#e0f2fe]/50 px-4 py-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#0284c7]">
              {agentStatus === "running"
                ? "Agent is working…"
                : agentStatus === "paused"
                  ? "Agent paused"
                  : "Agent is waiting for your response"}
            </span>
            {agentStatus === "running" ? (
              <button
                type="button"
                onClick={pauseAgent}
                className="flex items-center gap-1 font-medium text-[#64748b]"
              >
                <span className="inline-block h-2.5 w-2.5 bg-[#64748b]" /> Paused
              </button>
            ) : agentStatus === "paused" ? (
              <button
                type="button"
                onClick={resumeAgent}
                className="font-medium text-[#0284c7]"
              >
                Resume
              </button>
            ) : null}
          </div>
        </div>

        {/* Input */}
        <form onSubmit={(e) => void handleSubmit(e)} className="shrink-0 border-t border-[#eef2f6] p-4">
          {(activeFilterCount > 0 || tableLabel) && (
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-3 py-2">
              <Link
                href="/dashboard/competitors"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#f1f5f9] px-2.5 py-1 text-xs font-semibold text-[#334155] transition hover:bg-[#e2e8f0]"
              >
                <svg className="h-3.5 w-3.5 text-[#64748b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M10 3v18" />
                </svg>
                {tableLabel}
              </Link>
              {activeFilterCount > 0 && (
                <>
                  <span className="text-xs text-[#64748b]">
                    {activeFilterCount} active filter{activeFilterCount === 1 ? "" : "s"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFilterModalOpen(true)}
                    className="ml-auto text-xs font-semibold text-[#0284c7] hover:text-[#047857]"
                  >
                    Open filter panel
                  </button>
                </>
              )}
            </div>
          )}

          {showSuggestions && (
            <ul className="mb-2 overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-lg">
              {[...FILTER_SUGGESTIONS, ...COPILOT_SUGGESTIONS.map((s) => `Generate a ${s.toLowerCase()}`)].map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    className="w-full px-3 py-2.5 text-left text-sm text-[#334155] hover:bg-[#f8fafb]"
                    onClick={() => {
                      setInput(s);
                      setShowSuggestions(false);
                      inputRef.current?.focus();
                    }}
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="relative rounded-2xl border border-[#e2e8f0] bg-[#f8fafb] focus-within:border-[#0ea5e9] focus-within:ring-2 focus-within:ring-[#0ea5e9]/20">
            <textarea
              ref={inputRef}
              rows={3}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setShowSuggestions(e.target.value.length > 0 && e.target.value.length < 20);
              }}
              onFocus={() => setShowSuggestions(input.length > 0 && input.length < 20)}
              placeholder="Ask me anything — filter a table, or generate a dashboard widget…"
              className="w-full resize-none bg-transparent px-4 py-3 pr-12 text-sm text-[#0f172a] outline-none placeholder:text-[#94a3b8]"
              disabled={agentStatus === "running"}
            />
            <button
              type="submit"
              disabled={!input.trim() || agentStatus === "running"}
              className="absolute right-3 bottom-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#0ea5e9] text-white transition hover:bg-[#0284c7] disabled:opacity-40"
              aria-label={agentStatus === "running" ? "Stop" : "Send"}
            >
              {agentStatus === "running" ? (
                <span className="inline-block h-3 w-3 bg-white" />
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] px-3 py-1.5 text-xs font-medium text-[#64748b] hover:bg-[#f8fafb]"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Attach
            </button>
            <button
              type="button"
              onClick={() => {
                if (selectedWidget) setEditingWidget(!editingWidget);
              }}
              disabled={!selectedWidget}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                editingWidget
                  ? "border-[#0c1512] bg-[#0c1512] text-white"
                  : "border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafb] disabled:opacity-40"
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Edit
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
