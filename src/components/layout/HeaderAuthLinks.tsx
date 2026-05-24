"use client";

import { authClient } from "@/lib/auth/client";
import Link from "next/link";
import { useEffect, useState } from "react";

export function HeaderAuthLinks({ onDark }: { onDark: boolean }) {
  const [status, setStatus] = useState<"loading" | "guest" | "user" | "hidden">(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;
    authClient
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        setStatus(data?.session ? "user" : "guest");
      })
      .catch(() => {
        if (!cancelled) setStatus("hidden");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading" || status === "hidden") return null;

  const linkClass = onDark
    ? "text-sm font-medium text-white/75 transition hover:text-white"
    : "text-sm font-medium text-muted transition hover:text-ink";

  if (status === "user") {
    return (
      <Link href="/dashboard" className={linkClass}>
        Dashboard
      </Link>
    );
  }

  return (
    <Link href="/auth/sign-in" className={linkClass}>
      Sign in
    </Link>
  );
}
