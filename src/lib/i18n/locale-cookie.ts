export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

/** Clear next-intl locale cookie so sign-out lands on default (English) home. */
export function clearLocaleCookie(): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${LOCALE_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

export function redirectHomeAfterSignOut(extraQuery = ""): void {
  clearLocaleCookie();
  const query = extraQuery.startsWith("?") ? extraQuery : extraQuery ? `?${extraQuery}` : "";
  window.location.assign(`/${query}`);
}
