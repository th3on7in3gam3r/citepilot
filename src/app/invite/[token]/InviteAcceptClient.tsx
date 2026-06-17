"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";
import Link from "next/link";

type InvitePreview = {
  workspaceDomain: string;
  role: "viewer" | "editor";
  email: string;
  expired: boolean;
};

export function InviteAcceptClient({ token }: { token: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    void authClient.getSession().then(({ data }) => {
      setSignedIn(Boolean(data?.session));
    });
    void fetch(`/api/invite/${token}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { data?: InvitePreview } | null) => {
        setInvite(json?.data ?? null);
      })
      .catch(() => setInvite(null))
      .finally(() => setLoading(false));
  }, [token]);

  async function acceptInvite() {
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch(`/api/invite/${token}/accept`, {
        method: "PATCH",
        credentials: "include",
      });
      const data = (await res.json()) as {
        error?: string;
        data?: { workspaceId: string };
      };
      if (!res.ok) {
        setError(data.error ?? "Failed to accept invite");
        return;
      }
      const wsId = data.data?.workspaceId;
      router.push(wsId ? `/dashboard?ws=${wsId}` : "/dashboard");
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-surface" />;
  }

  if (!invite) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-semibold text-ink">Invite not found</h1>
        <p className="mt-2 text-sm text-muted">
          This invite may have been revoked or already used.
        </p>
        <Link href="/dashboard" className="mt-6 inline-block text-sm font-semibold text-accent">
          Go to dashboard
        </Link>
      </div>
    );
  }

  if (invite.expired) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-semibold text-ink">Invite expired</h1>
        <p className="mt-2 text-sm text-muted">
          Ask the workspace owner to send a new invite to {invite.email}.
        </p>
      </div>
    );
  }

  const returnUrl = `/invite/${token}${searchParams.toString() ? `?${searchParams}` : ""}`;

  if (!signedIn) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8">
        <h1 className="text-xl font-semibold text-ink">Workspace invitation</h1>
        <p className="mt-2 text-sm text-muted">
          You&apos;ve been invited to collaborate on{" "}
          <strong className="text-ink">{invite.workspaceDomain}</strong> as a{" "}
          <span className="capitalize">{invite.role}</span>.
        </p>
        <p className="mt-4 text-sm text-muted">
          Sign in or create an account with <strong>{invite.email}</strong> to accept.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href={`/auth/sign-in?from=${encodeURIComponent(returnUrl)}`}
            className="rounded-xl bg-ink px-4 py-3 text-center text-sm font-semibold text-white"
          >
            Sign in
          </Link>
          <Link
            href={`/auth/sign-up?from=${encodeURIComponent(returnUrl)}`}
            className="rounded-xl border border-border px-4 py-3 text-center text-sm font-semibold"
          >
            Create account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8">
      <h1 className="text-xl font-semibold text-ink">Accept invitation?</h1>
      <p className="mt-2 text-sm text-muted">
        Join the <strong className="text-ink">{invite.workspaceDomain}</strong> workspace as a{" "}
        <span className="capitalize">{invite.role}</span>.
      </p>
      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={accepting}
        onClick={() => void acceptInvite()}
        className="mt-6 w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {accepting ? "Accepting…" : "Accept invite"}
      </button>
    </div>
  );
}
