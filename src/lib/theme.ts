export const THEME_STORAGE_KEY = "theme";

export type ThemePreference = "light" | "dark" | "system";

export function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function getStoredTheme(): ThemePreference {
  if (typeof window === "undefined") return "system";
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemePreference(stored)) return stored;
  } catch {
    /* ignore */
  }
  return "system";
}

export function isDashboardPath(pathname: string): boolean {
  return pathname.startsWith("/dashboard");
}

export function resolveTheme(
  preference: ThemePreference,
  pathname?: string,
): "light" | "dark" {
  if (preference === "light") return "light";
  if (preference === "dark") return "dark";
  if (pathname && isDashboardPath(pathname)) return "dark";
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
}

export function applyThemeClass(resolved: "light" | "dark"): void {
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function setStoredTheme(preference: ThemePreference): void {
  localStorage.setItem(THEME_STORAGE_KEY, preference);
}

/** Inline script string — must run synchronously before first paint. */
export const themeInitScript = `(function(){try{var k='theme';var t=localStorage.getItem(k);var p=t==='light'||t==='dark'||t==='system'?t:'system';var d=false;if(p==='dark')d=true;else if(p==='light')d=false;else{var dash=location.pathname.indexOf('/dashboard')===0;if(dash)d=true;else d=window.matchMedia('(prefers-color-scheme: dark)').matches;}document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;
