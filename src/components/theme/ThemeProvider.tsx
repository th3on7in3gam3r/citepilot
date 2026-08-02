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
import { usePathname } from "next/navigation";
import {
  applyThemeClass,
  getStoredTheme,
  resolveTheme,
  setStoredTheme,
  type ThemePreference,
} from "@/lib/theme";

type ThemeContextValue = {
  preference: ThemePreference;
  resolved: "light" | "dark";
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  const syncTheme = useCallback(
    (nextPreference: ThemePreference, nextPathname?: string) => {
      const nextResolved = resolveTheme(nextPreference, nextPathname ?? pathname);
      setResolved(nextResolved);
      applyThemeClass(nextResolved);
    },
    [pathname],
  );

  useEffect(() => {
    const stored = getStoredTheme();
    setPreferenceState(stored);
    syncTheme(stored);
  }, [syncTheme]);

  useEffect(() => {
    syncTheme(preference);
  }, [pathname, preference, syncTheme]);

  useEffect(() => {
    if (preference !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => syncTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preference, syncTheme]);

  const setPreference = useCallback(
    (next: ThemePreference) => {
      setStoredTheme(next);
      setPreferenceState(next);
      syncTheme(next);
    },
    [syncTheme],
  );

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
