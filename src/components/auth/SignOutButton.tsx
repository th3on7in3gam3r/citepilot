"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Sign out failed", error);
    }
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className={
        className ??
        "text-sm font-medium text-muted hover:text-ink disabled:opacity-60"
      }
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
