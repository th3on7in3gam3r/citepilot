"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { DashboardPageSkeleton } from "@/components/dashboard/layout/DashboardPageSkeleton";

/**
 * SEO hub routes (`/dashboard`, analytics, …) skip Neon middleware so crawlers
 * can read server HTML. Browsers still mount the client shell — gate API-heavy
 * providers until a real session exists, otherwise `/api/workspaces` 401s spam.
 */
export function DashboardAuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void authClient
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        if (data?.session) {
          setAllowed(true);
          return;
        }
        const signIn = new URL("/auth/sign-in", window.location.origin);
        signIn.searchParams.set("from", pathname || "/dashboard");
        router.replace(`${signIn.pathname}${signIn.search}`);
      })
      .catch(() => {
        if (cancelled) return;
        const signIn = new URL("/auth/sign-in", window.location.origin);
        signIn.searchParams.set("from", pathname || "/dashboard");
        router.replace(`${signIn.pathname}${signIn.search}`);
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!allowed) {
    return <DashboardPageSkeleton />;
  }

  return <>{children}</>;
}
