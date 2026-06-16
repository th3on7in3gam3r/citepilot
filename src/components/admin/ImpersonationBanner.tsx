"use client";

import { useEffect, useState } from "react";

export function ImpersonationBanner() {
  const [state, setState] = useState<{
    active: boolean;
    targetEmail?: string;
  }>({ active: false });

  useEffect(() => {
    void fetch("/api/admin/impersonation/status", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { active?: boolean; targetEmail?: string } | null) => {
        setState({
          active: Boolean(data?.active),
          targetEmail: data?.targetEmail,
        });
      })
      .catch(() => undefined);
  }, []);

  if (!state.active) return null;

  return (
    <div className="sticky top-0 z-50 border-b border-rose-300 bg-rose-600 px-4 py-2 text-center text-sm font-semibold text-white">
      ⚠ ADMIN: Viewing as {state.targetEmail ?? "user"} —{" "}
      <button
        type="button"
        onClick={() => {
          void fetch("/api/admin/impersonate", {
            method: "DELETE",
            credentials: "include",
          }).then(() => {
            window.location.href = "/admin/users";
          });
        }}
        className="underline hover:no-underline"
      >
        Exit impersonation
      </button>
    </div>
  );
}
