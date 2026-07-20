"use client";

import { authClient } from "@/lib/auth/client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

/**
 * Always render Sign in (or Dashboard when session is known).
 * Never hide on auth failures — Neon outages / quota used to wipe the login CTA.
 */
export function HeaderAuthLinks({ onDark }: { onDark: boolean }) {
  const t = useTranslations("nav");
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authClient
      .getSession()
      .then(({ data }) => {
        if (!cancelled) setSignedIn(Boolean(data?.session));
      })
      .catch(() => {
        // Auth upstream may be down (e.g. Neon COMPUTE_QUOTA_EXCEEDED) —
        // still show Sign in so existing users can reach /auth/sign-in.
        if (!cancelled) setSignedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const linkClass = onDark
    ? "text-sm font-semibold text-white/85 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    : "text-sm font-semibold text-muted transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:text-[#94a3b8] dark:hover:text-white";

  if (signedIn) {
    return (
      <Link href="/dashboard" className={linkClass} aria-label={t("dashboard")}>
        {t("dashboard")}
      </Link>
    );
  }

  return (
    <Link href="/auth/sign-in" className={linkClass} aria-label={t("signIn")}>
      {t("signIn")}
    </Link>
  );
}
