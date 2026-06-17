"use client";

import type { ReactNode } from "react";
import { PostHogProvider } from "@/components/analytics/PostHogInit";
import { SuppressExtensionConsoleNoise } from "@/components/analytics/SuppressExtensionConsoleNoise";
import { ToastProvider } from "@/components/notifications/ToastProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <PostHogProvider>
        <SuppressExtensionConsoleNoise />
        <ToastProvider>{children}</ToastProvider>
      </PostHogProvider>
    </ThemeProvider>
  );
}
