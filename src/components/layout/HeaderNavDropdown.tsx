"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type NavDropdownItem = {
  label: string;
  href: string;
  description?: string;
};

export function HeaderNavDropdown({
  label,
  href,
  items,
  onDark,
}: {
  label: string;
  href: string;
  items: readonly NavDropdownItem[];
  onDark: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1 text-sm font-medium transition ${
          onDark
            ? "text-white/75 hover:text-white"
            : "text-muted hover:text-ink"
        }`}
      >
        {label}
        <svg
          className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute top-full left-1/2 z-50 mt-3 w-72 -translate-x-1/2 rounded-2xl border p-2 shadow-xl ${
            onDark
              ? "border-white/10 bg-[#0a101c]/95 backdrop-blur-md"
              : "border-border bg-white"
          }`}
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block rounded-xl px-3 py-2.5 transition ${
                onDark ? "hover:bg-white/10" : "hover:bg-cream"
              }`}
            >
              <span
                className={`block text-sm font-semibold ${
                  onDark ? "text-white" : "text-ink"
                }`}
              >
                {item.label}
              </span>
              {item.description && (
                <span
                  className={`mt-0.5 block text-xs leading-relaxed ${
                    onDark ? "text-white/50" : "text-muted"
                  }`}
                >
                  {item.description}
                </span>
              )}
            </Link>
          ))}
          <div
            className={`mt-1 border-t pt-1 ${
              onDark ? "border-white/10" : "border-border"
            }`}
          >
            <Link
              href={href}
              onClick={() => setOpen(false)}
              className={`block rounded-xl px-3 py-2 text-xs font-semibold ${
                onDark ? "text-glow hover:bg-white/10" : "text-accent hover:bg-cream"
              }`}
            >
              View all free tools →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
