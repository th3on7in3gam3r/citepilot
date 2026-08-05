"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { trackEvent } from "@/lib/analytics/track";

type ChatMessage = { role: "user" | "assistant"; content: string };

function shouldHideAssistant(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api")
  );
}

export function SiteAssistantWidget() {
  const t = useTranslations("assistant");
  const pathname = usePathname();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLead, setShowLead] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadCompany, setLeadCompany] = useState("");
  const [leadIntent, setLeadIntent] = useState("");
  const [leadSending, setLeadSending] = useState(false);
  const [leadDone, setLeadDone] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);

  const hidden = shouldHideAssistant(pathname);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open, showLead]);

  if (hidden) return null;

  function openPanel() {
    setOpen(true);
    trackEvent("assistant_opened");
  }

  async function sendMessage(e?: FormEvent) {
    e?.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content },
    ];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    setError(null);
    trackEvent("assistant_message_sent");

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const json = (await res.json()) as {
        data?: { reply?: string; suggestLead?: boolean };
        error?: string;
      };
      if (!res.ok || !json.data?.reply) {
        setError(json.error ?? t("error"));
        return;
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: json.data!.reply! },
      ]);
      if (json.data.suggestLead) {
        setShowLead(true);
        if (!leadIntent) setLeadIntent(content.slice(0, 500));
      }
    } catch {
      setError(t("error"));
    } finally {
      setSending(false);
    }
  }

  async function submitLead(e: FormEvent) {
    e.preventDefault();
    if (leadSending || leadDone) return;
    setLeadSending(true);
    setLeadError(null);

    const transcript = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n")
      .slice(0, 8000);

    try {
      const res = await fetch("/api/assistant/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: leadName.trim(),
          email: leadEmail.trim(),
          company: leadCompany.trim(),
          intent: leadIntent.trim() || "Site assistant inquiry",
          transcript,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setLeadError(json.error ?? t("leadError"));
        return;
      }
      setLeadDone(true);
      trackEvent("assistant_lead_drafted");
    } catch {
      setLeadError(t("leadError"));
    } finally {
      setLeadSending(false);
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[90] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="pointer-events-auto flex max-h-[min(32rem,calc(100vh-6rem))] w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-[0_16px_48px_rgba(0,0,0,0.18)]"
        >
          <div className="flex items-start justify-between gap-3 border-b border-border bg-surface px-4 py-3">
            <div>
              <h2
                id={titleId}
                className="font-display text-base font-bold text-ink"
              >
                {t("title")}
              </h2>
              <p className="mt-0.5 text-xs text-muted">{t("subtitle")}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full px-2 py-1 text-sm font-semibold text-muted hover:bg-background hover:text-ink"
              aria-label={t("close")}
            >
              ✕
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
            {messages.length === 0 && (
              <p className="text-muted">{t("emptyHint")}</p>
            )}
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={
                  m.role === "user"
                    ? "ml-6 rounded-2xl bg-accent px-3 py-2 text-white"
                    : "mr-4 rounded-2xl border border-border bg-surface px-3 py-2 text-ink"
                }
              >
                {m.content}
              </div>
            ))}
            {sending && <p className="text-xs text-muted">{t("thinking")}</p>}
            {error && <p className="text-xs text-red-700">{error}</p>}

            {showLead && (
              <div className="rounded-xl border border-border bg-surface p-3">
                <p className="font-semibold text-ink">{t("leadTitle")}</p>
                <p className="mt-1 text-xs text-muted">{t("leadHint")}</p>
                {leadDone ? (
                  <p className="mt-3 text-sm text-emerald-800">{t("leadSuccess")}</p>
                ) : (
                  <form onSubmit={(e) => void submitLead(e)} className="mt-3 space-y-2">
                    <label className="block text-xs font-medium text-ink">
                      {t("leadName")}
                      <input
                        required
                        value={leadName}
                        onChange={(e) => setLeadName(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm"
                      />
                    </label>
                    <label className="block text-xs font-medium text-ink">
                      {t("leadEmail")}
                      <input
                        required
                        type="email"
                        value={leadEmail}
                        onChange={(e) => setLeadEmail(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm"
                      />
                    </label>
                    <label className="block text-xs font-medium text-ink">
                      {t("leadCompany")}
                      <input
                        value={leadCompany}
                        onChange={(e) => setLeadCompany(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm"
                      />
                    </label>
                    <label className="block text-xs font-medium text-ink">
                      {t("leadIntent")}
                      <textarea
                        required
                        rows={2}
                        value={leadIntent}
                        onChange={(e) => setLeadIntent(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm"
                      />
                    </label>
                    {leadError && (
                      <p className="text-xs text-red-700">{leadError}</p>
                    )}
                    <button
                      type="submit"
                      disabled={leadSending}
                      className="w-full rounded-full bg-ink px-3 py-2 text-xs font-semibold text-white hover:bg-ink/90 disabled:opacity-60"
                    >
                      {leadSending ? "…" : t("leadSubmit")}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {!showLead && (
            <button
              type="button"
              onClick={() => setShowLead(true)}
              className="pointer-events-auto border-t border-border px-4 py-2 text-left text-xs font-semibold text-accent hover:bg-surface"
            >
              {t("talkToTeam")} →
            </button>
          )}

          <form
            onSubmit={(e) => void sendMessage(e)}
            className="pointer-events-auto border-t border-border p-3"
          >
            <label className="sr-only" htmlFor="site-assistant-input">
              {t("placeholder")}
            </label>
            <div className="flex gap-2">
              <textarea
                id="site-assistant-input"
                ref={inputRef}
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder={t("placeholder")}
                className="min-h-[2.75rem] flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-ink"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="shrink-0 self-end rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-deep disabled:opacity-50"
              >
                {t("send")}
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        className="pointer-events-auto rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-accent-deep"
        aria-label={open ? t("close") : t("open")}
        aria-expanded={open}
      >
        {open ? t("close") : t("launcherLabel")}
      </button>
    </div>
  );
}
