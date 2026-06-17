"use client";

import { authClient } from "@/lib/auth/client";
import { nav } from "@/lib/site";
import { Logo } from "@/components/ui/Logo";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const MOBILE_MENU_ID = "header-mobile-menu";

function MenuIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function HeaderMobileNav({ onDark }: { onDark: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useFocusTrap(dialogRef, open, () => setOpen(false));

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    authClient
      .getSession()
      .then(({ data }) => {
        if (!cancelled) setSignedIn(Boolean(data?.session));
      })
      .catch(() => {
        if (!cancelled) setSignedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const toggleClass = onDark
    ? "border-white/20 text-white hover:bg-white/10"
    : "border-border text-ink hover:bg-surface";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border lg:hidden ${toggleClass}`}
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls={MOBILE_MENU_ID}
      >
        <MenuIcon />
      </button>

      {open && (
        <div
          ref={dialogRef}
          className="fixed inset-0 z-[60] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="header-mobile-menu-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside
            id={MOBILE_MENU_ID}
            className="absolute top-0 right-0 flex h-full w-[min(100%,20rem)] flex-col border-l border-border bg-background shadow-xl dark:border-[#222] dark:bg-[#111]"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-4">
              <Logo className="text-base" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-ink"
                aria-label="Close menu"
              >
                <CloseIcon />
              </button>
            </div>

            <h2 id="header-mobile-menu-title" className="sr-only">
              Main navigation
            </h2>

            <nav
              className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-4"
              aria-label="Main navigation"
            >
              {nav.main.map((item) => {
                if ("children" in item && item.children) {
                  return (
                    <div key={item.label} className="mb-2">
                      <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                        {item.label}
                      </p>
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setOpen(false)}
                          className="flex min-h-[44px] flex-col justify-center rounded-xl px-3 py-2.5 transition hover:bg-surface"
                        >
                          <span className="block text-sm font-semibold text-ink">
                            {child.label}
                          </span>
                          {child.description && (
                            <span className="mt-0.5 block text-xs text-muted">
                              {child.description}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-[44px] items-center rounded-xl px-3 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface"
                  >
                    {item.label}
                  </Link>
                );
              })}

              <div className="my-2 border-t border-border" />

              {nav.secondary.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[44px] items-center rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-surface hover:text-ink"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="shrink-0 space-y-2 border-t border-border px-4 py-4">
              {signedIn ? (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="block rounded-xl border border-border px-4 py-2.5 text-center text-sm font-semibold text-ink transition hover:bg-surface"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/auth/sign-in"
                  onClick={() => setOpen(false)}
                  className="block rounded-xl border border-border px-4 py-2.5 text-center text-sm font-semibold text-ink transition hover:bg-surface"
                >
                  Sign in
                </Link>
              )}
              <Link
                href={nav.startAnalysis.href}
                onClick={() => setOpen(false)}
                className="block rounded-full bg-gradient-to-r from-[#6b8cff] via-accent to-accent-deep px-4 py-3 text-center text-sm font-semibold text-white shadow-[0_4px_16px_rgba(14,165,233,0.35)]"
              >
                {nav.startAnalysis.label}
              </Link>
              <Link
                href={nav.cta.href}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-4 py-2 text-center text-sm font-medium text-accent transition hover:text-accent-deep"
              >
                {nav.cta.label}
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
