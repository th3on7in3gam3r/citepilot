"use client";

import { useEffect } from "react";
import { isBenignExtensionConsoleMessage } from "@/lib/extension-console-noise";

function patchConsoleMethod(
  method: "error" | "warn" | "log" | "info" | "debug",
): () => void {
  const original = console[method];
  if (typeof original !== "function") return () => {};

  console[method] = (...args: unknown[]) => {
    if (isBenignExtensionConsoleMessage(args)) return;
    original.apply(console, args);
  };

  return () => {
    console[method] = original;
  };
}

/** Re-applies console filters after hydration (inline script runs earlier in <head>). */
export function SuppressExtensionConsoleNoise() {
  useEffect(() => {
    const restore = (["error", "warn", "log", "info", "debug"] as const).map(
      patchConsoleMethod,
    );

    const onWindowError = (event: ErrorEvent) => {
      if (isBenignExtensionConsoleMessage([event.message ?? ""])) {
        event.preventDefault();
      }
    };

    window.addEventListener("error", onWindowError);

    return () => {
      restore.forEach((fn) => fn());
      window.removeEventListener("error", onWindowError);
    };
  }, []);

  return null;
}
