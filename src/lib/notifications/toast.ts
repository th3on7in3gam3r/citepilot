export type ToastType = "success" | "error" | "warning" | "info";

export type ToastAction = {
  label: string;
  onClick?: () => void;
  href?: string;
};

export type ToastInput = {
  type?: ToastType;
  title: string;
  description?: string;
  action?: ToastAction;
  /** Auto-dismiss ms. Set 0 to persist until closed. Default 4000. */
  duration?: number;
  theme?: "dark" | "light";
};

export type ToastRecord = ToastInput & {
  id: string;
  type: ToastType;
  duration: number;
  createdAt: number;
};

export const TOAST_DEFAULT_DURATION = 4000;

export function createToastId(): string {
  return `toast_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function normalizeToast(input: ToastInput): ToastRecord {
  return {
    id: createToastId(),
    type: input.type ?? "info",
    title: input.title,
    description: input.description,
    action: input.action,
    duration: input.duration ?? TOAST_DEFAULT_DURATION,
    theme: input.theme ?? "dark",
    createdAt: Date.now(),
  };
}

export const TOAST_STYLES: Record<
  ToastType,
  { icon: string; progress: string; ring: string; lightIcon: string }
> = {
  success: {
    icon: "bg-[#0ea5e9] text-white",
    progress: "bg-[#0ea5e9]",
    ring: "ring-[#0ea5e9]/30",
    lightIcon: "bg-[#e0f2fe] text-[#0284c7]",
  },
  error: {
    icon: "bg-[#ef4444] text-white",
    progress: "bg-[#ef4444]",
    ring: "ring-[#ef4444]/30",
    lightIcon: "bg-red-50 text-red-600",
  },
  warning: {
    icon: "bg-[#f59e0b] text-white",
    progress: "bg-[#f59e0b]",
    ring: "ring-[#f59e0b]/30",
    lightIcon: "bg-amber-50 text-amber-700",
  },
  info: {
    icon: "bg-[#38bdf8] text-white",
    progress: "bg-[#38bdf8]",
    ring: "ring-[#38bdf8]/30",
    lightIcon: "bg-sky-50 text-sky-700",
  },
};
