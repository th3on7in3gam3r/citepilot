"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useGridFilter } from "@/components/dashboard/copilot/GridFilterProvider";
import { useToast } from "@/components/notifications/ToastProvider";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import {
  loadStoredWidgets,
  saveStoredWidgets,
  type DashboardWidget,
} from "@/lib/copilot/widgets";

export type CopilotMessage =
  | { id: string; role: "user"; text: string; time: string }
  | { id: string; role: "assistant"; text: string; time: string }
  | { id: string; role: "status"; text: string; duration?: string; done?: boolean };

export type AgentStatus = "idle" | "running" | "paused";

type CopilotContextValue = {
  isOpen: boolean;
  openCopilot: () => void;
  closeCopilot: () => void;
  toggleCopilot: () => void;
  messages: CopilotMessage[];
  agentStatus: AgentStatus;
  widgets: DashboardWidget[];
  selectedWidgetId: string | null;
  editingWidget: boolean;
  setEditingWidget: (v: boolean) => void;
  selectWidget: (id: string | null) => void;
  addWidget: (widget: DashboardWidget) => void;
  updateWidget: (id: string, patch: Partial<DashboardWidget>) => void;
  removeWidget: (id: string) => void;
  clearHighlight: (id: string) => void;
  sendPrompt: (prompt: string) => Promise<void>;
  pauseAgent: () => void;
  resumeAgent: () => void;
};

const CopilotContext = createContext<CopilotContextValue | null>(null);

function msgId(): string {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function timeLabel(): string {
  return new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CopilotProvider({ children }: { children: ReactNode }) {
  const { workspace } = useWorkspaceContext();
  const workspaceId = workspace?.workspaceId ?? workspace?.id ?? null;
  const {
    tableLabel,
    isFilterPrompt: detectFilterPrompt,
    generateFiltersFromPrompt,
  } = useGridFilter();
  const toast = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>("idle");
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [editingWidget, setEditingWidget] = useState(false);
  const [hasWelcomed, setHasWelcomed] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    const t = setTimeout(() => {
      setWidgets(loadStoredWidgets(workspaceId));
    }, 0);
    return () => clearTimeout(t);
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    saveStoredWidgets(workspaceId, widgets);
  }, [workspaceId, widgets]);

  useEffect(() => {
    if (isOpen && !hasWelcomed) {
      const t = setTimeout(() => {
        setHasWelcomed(true);
        setMessages([
          {
            id: msgId(),
            role: "assistant",
            time: timeLabel(),
            text: "Hi, this is CitePilot Copilot, your AI assistant! I can generate dynamic analytics widgets, uncover high-impact keywords, and analyze competitor rankings for your site.",
          },
        ]);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [isOpen, hasWelcomed]);

  const openCopilot = useCallback(() => setIsOpen(true), []);
  const closeCopilot = useCallback(() => {
    setIsOpen(false);
    setEditingWidget(false);
  }, []);
  const toggleCopilot = useCallback(() => setIsOpen((v) => !v), []);

  const addWidget = useCallback((widget: DashboardWidget) => {
    setWidgets((prev) => [...prev, widget]);
    setSelectedWidgetId(widget.id);
  }, []);

  const updateWidget = useCallback((id: string, patch: Partial<DashboardWidget>) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...patch, highlighted: patch.highlighted ?? w.highlighted } : w)),
    );
  }, []);

  const removeWidget = useCallback((id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    setSelectedWidgetId((cur) => (cur === id ? null : cur));
    setEditingWidget(false);
  }, []);

  const clearHighlight = useCallback((id: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, highlighted: false } : w)),
    );
  }, []);

  const pauseAgent = useCallback(() => setAgentStatus("paused"), []);
  const resumeAgent = useCallback(() => setAgentStatus("idle"), []);

  const sendPrompt = useCallback(
    async (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed || !workspaceId) return;

      setMessages((prev) => [
        ...prev,
        { id: msgId(), role: "user", text: trimmed, time: timeLabel() },
      ]);
      setAgentStatus("running");
      setEditingWidget(false);

      const isFilter = detectFilterPrompt(trimmed);

      const statusIds = [msgId(), msgId(), msgId(), msgId()];

      setMessages((prev) => [
        ...prev,
        ...statusIds.map((id, i) => ({
          id,
          role: "status" as const,
          text: isFilter
            ? [
                `Retrieving backlinks for ${workspace?.domain ?? "your site"}…`,
                "Retrieving competitor list…",
                "Analyzing competitor signals…",
                `Generating filters for ${tableLabel}…`,
              ][i]
            : [
                `Retrieving workspace data for ${workspace?.domain ?? "your site"}…`,
                "Matching visualization type…",
                "Generating widget…",
                "",
              ][i],
          done: false,
        })).filter((s) => s.text),
      ]);

      const start = Date.now();
      await new Promise((r) => setTimeout(r, 400));

      if (isFilter) {
        try {
          await generateFiltersFromPrompt(trimmed);
          const elapsed = Math.max(1, Math.round((Date.now() - start) / 1000));
          setMessages((prev) =>
            prev.map((m) =>
              statusIds.includes(m.id) && m.role === "status"
                ? { ...m, done: true, duration: `${elapsed}s` }
                : m,
            ),
          );
          setMessages((prev) => [
            ...prev,
            {
              id: msgId(),
              role: "assistant",
              time: timeLabel(),
              text: `Sure, I built filters for ${tableLabel}. The filter panel is open — review each condition, then click Apply filters. You'll be taken to the Competitor Analysis table to see results.`,
            },
          ]);
        } catch {
          setMessages((prev) => [
            ...prev,
            {
              id: msgId(),
              role: "assistant",
              time: timeLabel(),
              text: "Could not build those filters. Try being specific about column, operator, and value.",
            },
          ]);
        } finally {
          setAgentStatus("idle");
        }
        return;
      }

      try {
        const res = await fetch("/api/copilot/widgets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ workspaceId, prompt: trimmed }),
        });
        const data = (await res.json()) as {
          widget?: DashboardWidget;
          steps?: string[];
          error?: string;
        };

        const elapsed = Math.max(1, Math.round((Date.now() - start) / 1000));

        setMessages((prev) =>
          prev.map((m) =>
            statusIds.includes(m.id) && m.role === "status"
              ? { ...m, done: true, duration: `${elapsed}s` }
              : m,
          ),
        );

        if (!res.ok || !data.widget) {
          setMessages((prev) => [
            ...prev,
            {
              id: msgId(),
              role: "assistant",
              time: timeLabel(),
              text: data.error ?? "Could not generate that widget. Try rephrasing your prompt.",
            },
          ]);
          setAgentStatus("idle");
          return;
        }

        addWidget(data.widget);
        toast.success("Widget added", {
          description: `${data.widget!.name} is now on your dashboard.`,
          action: { label: "Okay" },
        });
        setMessages((prev) => [
          ...prev,
          {
            id: msgId(),
            role: "assistant",
            time: timeLabel(),
            text: `Added **${data.widget!.name}** to your dashboard. You can edit the chart type and data source anytime.`,
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: msgId(),
            role: "assistant",
            time: timeLabel(),
            text: "Network error — check your connection and try again.",
          },
        ]);
      } finally {
        setAgentStatus("idle");
      }
    },
    [
      workspaceId,
      workspace?.domain,
      addWidget,
      toast,
      detectFilterPrompt,
      generateFiltersFromPrompt,
      tableLabel,
    ],
  );

  const value = useMemo(
    (): CopilotContextValue => ({
      isOpen,
      openCopilot,
      closeCopilot,
      toggleCopilot,
      messages,
      agentStatus,
      widgets,
      selectedWidgetId,
      editingWidget,
      setEditingWidget,
      selectWidget: setSelectedWidgetId,
      addWidget,
      updateWidget,
      removeWidget,
      clearHighlight,
      sendPrompt,
      pauseAgent,
      resumeAgent,
    }),
    [
      isOpen,
      openCopilot,
      closeCopilot,
      toggleCopilot,
      messages,
      agentStatus,
      widgets,
      selectedWidgetId,
      editingWidget,
      addWidget,
      updateWidget,
      removeWidget,
      clearHighlight,
      sendPrompt,
    ],
  );

  return (
    <CopilotContext.Provider value={value}>{children}</CopilotContext.Provider>
  );
}

export function useCopilot(): CopilotContextValue {
  const ctx = useContext(CopilotContext);
  if (!ctx) {
    throw new Error("useCopilot must be used within CopilotProvider");
  }
  return ctx;
}

/** Safe hook when CopilotProvider may be absent */
export function useCopilotOptional(): CopilotContextValue | null {
  return useContext(CopilotContext);
}
