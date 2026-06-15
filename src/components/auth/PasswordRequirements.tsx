"use client";

import {
  checkPasswordRequirements,
  passwordMeetsRequirements,
} from "@/lib/auth/password-requirements";

export function PasswordRequirements({ password }: { password: string }) {
  const checks = checkPasswordRequirements(password);
  const allMet = passwordMeetsRequirements(password);

  const items = [
    { key: "minLength", label: "At least 8 characters", met: checks.minLength },
    { key: "hasLetter", label: "Includes a letter", met: checks.hasLetter },
    { key: "hasNumber", label: "Includes a number", met: checks.hasNumber },
  ] as const;

  return (
    <div
      className="rounded-xl border border-border bg-surface px-3 py-2.5 dark:border-[#333] dark:bg-[#141414]"
      aria-live="polite"
    >
      <p className="text-xs font-semibold text-muted">Password requirements</p>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li
            key={item.key}
            className={`flex items-center gap-2 text-xs ${
              item.met ? "text-mint" : "text-muted"
            }`}
          >
            <span aria-hidden>{item.met ? "✓" : "○"}</span>
            {item.label}
          </li>
        ))}
      </ul>
      {password.length > 0 && (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-border">
          <div
            className={`h-full transition-all ${
              allMet ? "w-full bg-mint" : "w-1/3 bg-accent"
            }`}
          />
        </div>
      )}
    </div>
  );
}
