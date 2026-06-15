"use client";

import { useState } from "react";
import { authInputClass, authLabelClass } from "@/components/auth/auth-styles";

export function PasswordField({
  name = "password",
  label = "Password",
  autoComplete,
  minLength,
  required = true,
  id,
  onChange,
}: {
  name?: string;
  label?: string;
  autoComplete: string;
  minLength?: number;
  required?: boolean;
  id?: string;
  onChange?: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const fieldId = id ?? name;

  return (
    <label htmlFor={fieldId} className={authLabelClass}>
      {label}
      <div className="relative mt-2">
        <input
          id={fieldId}
          name={name}
          type={visible ? "text" : "password"}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          suppressHydrationWarning
          onChange={(e) => onChange?.(e.target.value)}
          className={`${authInputClass} mt-0 pr-11`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-muted transition hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M3 3l18 18M10.58 10.58a2 2 0 002.84 2.84M9.88 5.09A10.94 10.94 0 0112 5c5 0 9.27 3.11 11 7.5a11.8 11.8 0 01-2.64 3.86M6.1 6.1A11.33 11.33 0 003 12.5C4.73 16.39 9 19.5 12 19.5c1.02 0 2-.13 2.93-.37" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </label>
  );
}
