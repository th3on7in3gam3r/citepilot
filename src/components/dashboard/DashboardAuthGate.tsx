"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { DashboardPageSkeleton } from "@/components/dashboard/layout/DashboardPageSkeleton";

function redirectToSignIn(router: ReturnType<typeof useRouter>, pathname: string) {
  const signIn = new URL("/auth/sign-in", window.location.origin);
  signIn.searchParams.set("from", pathname || "/dashboard");
  router.replace(`${signIn.pathname}${signIn.search}`);
}

/**
 * SEO hub routes stay crawlable for bots via proxy UA check, but browsers
 * must have a server-recognized session before mounting API-heavy providers.
 * Aligns with requireApiUser (user.id), not a loose client session object.
 */
export function DashboardAuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const { data } = await authClient.getSession();
        const userId = data?.user?.id;
        if (!userId) {
          if (!cancelled) redirectToSignIn(router, pathname);
          return;
        }

        // Prove the same cookies work for API routes (closes gate/API mismatch).
        const probe = await fetch("/api/workspaces", { credentials: "include" });
        if (cancelled) return;
        if (probe.status === 401) {
          redirectToSignIn(router, pathname);
          return;
        }
        if (!probe.ok) {
          // Transient server error — still allow shell; pages show their own errors.
          setAllowed(true);
          return;
        }
        setAllowed(true);
      } catch {
        if (!cancelled) redirectToSignIn(router, pathname);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!allowed) {
    return <DashboardPageSkeleton />;
  }

  return <>{children}</>;
}
