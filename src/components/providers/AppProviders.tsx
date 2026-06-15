"use client";

import type { ReactNode } from "react";
import { SuppressExtensionConsoleNoise } from "@/components/analytics/SuppressExtensionConsoleNoise";
import { ToastProvider } from "@/components/notifications/ToastProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SuppressExtensionConsoleNoise />
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}
