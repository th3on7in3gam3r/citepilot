"use client";

import { useEffect } from "react";

function isBenignExtensionMessage(args: unknown[]): boolean {
  const text = args.map((arg) => String(arg)).join(" ");
  return (
    text.includes("Could not establish connection") ||
    text.includes("Receiving end does not exist") ||
    text.includes("runtime.lastError")
  );
}

/** Hides benign Chrome extension messaging noise from third-party scripts. */
export function SuppressExtensionConsoleNoise() {
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args: unknown[]) => {
      if (isBenignExtensionMessage(args)) return;
      originalError(...args);
    };

    console.warn = (...args: unknown[]) => {
      if (isBenignExtensionMessage(args)) return;
      originalWarn(...args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  return null;
}
