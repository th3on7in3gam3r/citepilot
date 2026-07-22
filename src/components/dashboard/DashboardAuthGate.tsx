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

function hasClientSession(data: {
  user?: { id?: string | null } | null;
  session?: unknown;
} | null | undefined): boolean {
  return Boolean(data?.user?.id || data?.session);
}

/**
 * Soft client gate. Neon middleware already protects human browsers on
 * /dashboard*. Do NOT bounce to sign-in when /api/workspaces returns 401 —
 * that race (cookies not yet readable to API while client session exists)
 * is what locked users in a login loop.
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
        if (cancelled) return;

        if (!hasClientSession(data)) {
          // One refresh in case session cookies just landed after OAuth.
          const retry = await authClient.getSession();
          if (cancelled) return;
          if (!hasClientSession(retry.data)) {
            redirectToSignIn(router, pathname);
            return;
          }
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
